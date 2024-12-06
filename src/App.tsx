import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Card,
  CircularProgress,
} from "@mui/material";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import BigNumber from "bignumber.js";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";
import * as QRCode from "qrcode.react";
import { useNavigate } from "react-router-dom";

import "./App.css";

import {
  getSubmarineSwapFees,
  getReverseSwapFees,
  API_BASE_URL,
  createSubmarineSwap,
  getClaimTransactionDetails,
  validatePreimage,
  createClaimTransaction,
} from "./services/swapService";

const App: React.FC = () => {
  const [inputSats, setInputSats] = useState<any>("");
  const [outputSats, setOutputSats] = useState<any>("");
  const [serviceFeeSats, setserviceFeeSats] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [subInfo, setSubInfo] = useState<any>(null);
  const [reverseInfo, setReverseInfo] = useState<any>(null);
  const [invoice, setInvoice] = useState<string>("");
  const info: any = reverse ? reverseInfo : subInfo;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [swapData, setSwapData] = useState<any>(null);
  const [websocketStatus, setWebSocketStatus] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);
  const navigate = useNavigate();

  const serviceFeePct = info?.fees?.percentage || 0;
  const networkFee = reverse
    ? new BigNumber(info?.fees?.minerFees?.claim || 0).plus(
        info?.fees?.minerFees?.lockup || 0
      )
    : info?.fees?.minerFees || 0;

  const bigCeil = (big: BigNumber): BigNumber => {
    return big.integerValue(BigNumber.ROUND_CEIL);
  };

  const bigFloor = (big: BigNumber): BigNumber => {
    return big.integerValue(BigNumber.ROUND_FLOOR);
  };

  const numberWithCommas = (x: string | number) =>
    x?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";

  const submarineSwap = async (invoice: string) => {
    try {
      const keys: any = ECPairFactory(ecc).makeRandom();

      // Create Submarine Swap
      const createdResponse = await createSubmarineSwap(
        invoice,
        Buffer.from(keys.publicKey).toString("hex")
      );

      // Handle Errors in the Response
      if (createdResponse?.error) {
        console.log("Error creating swap:", createdResponse.error);
        setErrorMessage(createdResponse.error);
        return;
      }

      // Handle Successful Swap Creation
      console.log("Created swap:", createdResponse);
      setErrorMessage("");
      setSwapData(createdResponse); // Update the state for future use

      // WebSocket Initialization
      const webSocket = new WebSocket(
        `${API_BASE_URL.replace("http://", "ws://")}/ws`
      );

      // Handle WebSocket open event
      webSocket.onopen = () => {
        webSocket.send(
          JSON.stringify({
            op: "subscribe",
            channel: "swap.update",
            args: [createdResponse.id],
          })
        );
        console.log("WebSocket connection opened.");
      };

      // Handle WebSocket message event
      webSocket.onmessage = async (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event !== "update") return;

          console.log("WebSocket Update:", msg);

          const status = msg.args[0].status;
          setWebSocketStatus(status);

          switch (status) {
            case "invoice.set":
              console.log("Waiting for onchain transaction...");
              navigate(`/swap/${createdResponse.id}`);
              setShowQRCode(true);
              break;

            case "transaction.mempool":
              console.log("Transaction is in mempool");
              setShowQRCode(false);
              break;

            case "transaction.claim.pending":
              console.log("Creating cooperative claim transaction...");
              const claimTxDetails = (
                await getClaimTransactionDetails(createdResponse.id)
              ).data;

              // Validate Preimage
              if (!validatePreimage(invoice, claimTxDetails.preimage)) {
                console.error("Invalid preimage from Boltz.");
                return;
              }

              await createClaimTransaction(
                claimTxDetails,
                createdResponse,
                keys
              );
              break;

            case "transaction.claimed":
              console.log("Swap successful!");
              webSocket.close();
              break;

            default:
              console.warn("Unhandled status:", status);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      };

      // Handle WebSocket error event
      webSocket.onerror = (error: Event) => {
        console.error("WebSocket error:", error);
      };

      // Handle WebSocket close event
      webSocket.onclose = (event: CloseEvent) => {
        console.log(`WebSocket connection closed. Code: ${event.code}`);
      };
    } catch (error) {
      console.error("Error in submarineSwap:", error);
    }
  };

  const calculateReceiveAmount = (
    sendAmount: BigNumber,
    serviceFee: number,
    minerFee: number
  ): BigNumber => {
    const receiveAmount = reverse
      ? sendAmount
          .minus(bigCeil(sendAmount.times(serviceFee).div(100)))
          .minus(minerFee)
      : sendAmount
          .minus(minerFee)
          .div(new BigNumber(1).plus(new BigNumber(serviceFee).div(100)));
    return BigNumber.maximum(bigFloor(receiveAmount), 0);
  };

  const calculateServiceFeeOnSend = (
    sendAmount: BigNumber,
    serviceFee: number,
    minerFee: number
  ): BigNumber => {
    if (sendAmount.isNaN()) {
      return new BigNumber(0);
    }

    let fee: BigNumber;

    if (reverse) {
      fee = bigCeil(sendAmount.times(serviceFee).div(100));
    } else {
      fee = sendAmount
        .minus(calculateReceiveAmount(sendAmount, serviceFee, minerFee))
        .minus(minerFee);

      if (sendAmount.toNumber() < minerFee) {
        fee = new BigNumber(0);
      }
    }

    return bigCeil(fee);
  };

  const calculateSendAmount = (
    receiveAmount: BigNumber,
    serviceFee: number,
    minerFee: number
  ): BigNumber => {
    return reverse
      ? bigCeil(
          receiveAmount
            .plus(minerFee)
            .div(new BigNumber(1).minus(new BigNumber(serviceFee).div(100)))
        )
      : bigFloor(
          receiveAmount
            .plus(
              bigCeil(receiveAmount.times(new BigNumber(serviceFee).div(100)))
            )
            .plus(minerFee)
        );
  };

  const calculateLimit = (limit: number): number => {
    return !reverse
      ? calculateSendAmount(
          new BigNumber(limit),
          serviceFeePct,
          networkFee
        ).toNumber()
      : limit;
  };

  const min = calculateLimit(info?.limits?.minimal || 0);
  const max = calculateLimit(info?.limits?.maximal || 0);

  const errorInput =
    (inputSats !== 0 && inputSats !== "" && inputSats < min) || inputSats > max;
  const errorOutput = outputSats < 0;
  const error = errorInput || errorOutput;

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const submarine = await getSubmarineSwapFees();
        const reverse = await getReverseSwapFees();
        setSubInfo(submarine);
        setReverseInfo(reverse);
      } catch (error) {
        console.error("Failed to fetch swap fees.");
      }
    };

    fetchFees();
  }, []);

  const handleSwap = () => {
    setReverse(!reverse);
  };
  return (
    <Card
      sx={{
        display: "flex",
        maxWidth: "600px",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        padding: 5,
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
      }}
    >
      {errorMessage && (
        <Typography color="red" align="center" sx={{ mb: 2, width: "100%" }}>
          {errorMessage}
        </Typography>
      )}

      {swapData && swapData.bip21 && showQRCode ? (
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Scan to Pay
          </Typography>
          <QRCode.QRCodeCanvas value={swapData.bip21} size={200} />
        </Box>
      ) : swapData && websocketStatus ? (
        <Box sx={{ textAlign: "center", width: "100%" }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Status: {websocketStatus}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ width: "100%", color: "#a3a3a3" }}>
          <Typography variant="h5" align="center" sx={{ mb: 1, width: "100%" }}>
            Create Atomic Swap
          </Typography>

          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 2, width: "100%" }}
          >
            Payment Includes Network and Service Fee
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 3,
              fontSize: "14px",
              width: "100%",
            }}
          >
            <Typography>
              Send min: {numberWithCommas(new BigNumber(min).toString())} sats
            </Typography>
            <Typography>
              Send max: {numberWithCommas(new BigNumber(max).toString())} sats
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              width: "100%",
            }}
          >
            <TextField
              label={reverse ? "Lightning" : "Bitcoin"}
              placeholder={"0"}
              variant="outlined"
              error={errorInput}
              onChange={(e: any) => {
                setErrorMessage("");
                const inputAmount = e.target.value;
                if (!inputAmount || inputAmount === "0") {
                  setserviceFeeSats(0);
                  setOutputSats(0);
                }

                const satAmount = new BigNumber(inputAmount || 0);

                const outputSats: any = calculateReceiveAmount(
                  satAmount,
                  serviceFeePct,
                  networkFee
                );

                const serviceFees: any = calculateServiceFeeOnSend(
                  satAmount,
                  serviceFeePct,
                  networkFee
                );
                setserviceFeeSats(serviceFees);
                setInputSats(Number(inputAmount));
                setOutputSats(outputSats);
              }}
              sx={{
                "& .MuiInputLabel-root": {
                  color: () => (errorInput ? "red" : "#a3a3a3"),
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: () => (errorInput ? "red" : "#a3a3a3"),
                  },
                  "&:hover fieldset": {
                    borderColor: () => (errorInput ? "red" : "#a3a3a3"),
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: () => (errorInput ? "red" : "#a3a3a3"),
                  },
                  "& input": {
                    color: "#a3a3a3",
                  },
                  "& input::placeholder": {
                    color: "#a3a3a3",
                  },
                },
              }}
              value={inputSats.toString()}
              fullWidth
            />
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <IconButton style={{ color: "#ffd24b" }} onClick={handleSwap}>
                <SwapVertIcon fontSize="large" />
              </IconButton>
            </Box>
            <TextField
              label={reverse ? "Bitcoin" : "Lightning"}
              placeholder={"0"}
              variant="outlined"
              error={errorOutput}
              onChange={(e: any) => {
                setErrorMessage("");

                const inputAmount = e.target.value;

                if (!inputAmount || inputAmount === "0") {
                  setserviceFeeSats(0);
                  setOutputSats(0);
                }

                const satAmount = new BigNumber(inputAmount || 0);

                let input: any;
                if (satAmount.isEqualTo(0)) {
                  input = 0;
                } else
                  input = calculateSendAmount(
                    satAmount,
                    serviceFeePct,
                    networkFee
                  );

                const serviceFeeSats: any = bigCeil(
                  reverse && input
                    ? input.times(serviceFeePct).div(100)
                    : satAmount.times(serviceFeePct).div(100)
                );

                setInputSats(input);
                setOutputSats(Number(inputAmount));
                setserviceFeeSats(serviceFeeSats);
              }}
              sx={{
                "& .MuiInputLabel-root": {
                  color: () => (errorOutput ? "red" : "#a3a3a3"),
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: () => (errorOutput ? "red" : "#a3a3a3"),
                  },
                  "&:hover fieldset": {
                    borderColor: () => (errorOutput ? "red" : "#a3a3a3"),
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: () => (errorOutput ? "red" : "#a3a3a3"),
                  },
                  "& input": {
                    color: "#a3a3a3",
                  },
                  "& input::placeholder": {
                    color: "#a3a3a3",
                  },
                },
              }}
              value={outputSats.toString()}
              fullWidth
            />
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                flexDirection: "column",
                mt: 2,
                width: "100%",
              }}
            >
              <Typography variant="body2" sx={{ textAlign: "right" }}>
                Network Fee: {numberWithCommas(networkFee.toString())} sats
              </Typography>
              <Typography variant="body2" sx={{ textAlign: "right" }}>
                Service Fee ({serviceFeePct.toString()}%):{" "}
                {serviceFeeSats.toString()} sats
              </Typography>
            </Box>
            <TextField
              placeholder={
                reverse ? "Enter BTC address" : "Paste a Lightning invoice"
              }
              multiline
              onChange={(e) => {
                setErrorMessage("");
                setInvoice(e.target.value);
              }}
              sx={{
                "& .MuiInputLabel-root": {
                  color: "#a3a3a3",
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "#a3a3a3", // Border color
                  },
                  "&:hover fieldset": {
                    borderColor: "#a3a3a3", // Border color on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#a3a3a3", // Border color when focused
                  },
                  "& input": {
                    color: "#a3a3a3", // Input text color
                  },
                  "& textarea": {
                    color: "#a3a3a3",
                  },
                  "& input::placeholder, & textarea::placeholder": {
                    color: "#a3a3a3", // Placeholder color
                    opacity: 0.5, // Ensure the placeholder opacity is set to fully visible
                  },
                },
              }}
              rows={5}
              value={invoice}
              variant="outlined"
              fullWidth
              error={errorOutput} // Show error state
            />

            <Button
              style={{ marginTop: 18 }}
              className="secondary-btn"
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => submarineSwap(invoice)}
            >
              Create Atomic Swap
            </Button>
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default App;
