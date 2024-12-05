import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Card,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import BigNumber from "bignumber.js";
import { ECPairFactory } from "ecpair";
import * as ecc from "tiny-secp256k1";

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
    console.log("invoice:", invoice);
    try {
      const keys: any = ECPairFactory(ecc).makeRandom();

      // Create Submarine Swap
      const createdResponse = (
        await createSubmarineSwap(
          invoice,
          Buffer.from(keys.publicKey).toString("hex")
        )
      ).data;
      console.log("Created swap:", createdResponse);

      // WebSocket Initialization
      const webSocket = new WebSocket(
        `${API_BASE_URL.replace("http://", "ws://")}/ws`
      );

      // Handle WebSocket open event
      webSocket.onopen = () => {
        console.log("WebSocket connection opened.");
        webSocket.send(
          JSON.stringify({
            op: "subscribe",
            channel: "swap.update",
            args: [createdResponse.id],
          })
        );
      };

      // Handle WebSocket message event
      webSocket.onmessage = async (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event !== "update") return;

          console.log("WebSocket Update:", msg);

          switch (msg.args[0].status) {
            case "invoice.set":
              console.log("Waiting for onchain transaction...");
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
              console.warn("Unhandled status:", msg.args[0].status);
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
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Card
        sx={{
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          maxWidth: 500,
          width: "100%",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 1 }}>
          Create Atomic Swap
        </Typography>

        <Typography variant="body2" align="center" sx={{ mb: 2 }}>
          Payment Includes Network and Service Fee
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 3,
            fontSize: "14px",
            color: "gray",
          }}
        >
          <Typography>
            Send min: {numberWithCommas(new BigNumber(min).toString())} sats
          </Typography>
          <Typography>
            Send max: {numberWithCommas(new BigNumber(max).toString())} sats
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={reverse ? "Lightning" : "Bitcoin"}
            placeholder={"0"}
            variant="outlined"
            error={errorInput}
            onChange={(e: any) => {
              const inputAmount = e.target.value;
              console.log(inputAmount, typeof inputAmount);
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
            value={inputSats.toString()}
          />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconButton color="primary" onClick={handleSwap}>
              <SwapHorizIcon fontSize="large" />
            </IconButton>
          </Box>
          <TextField
            label={reverse ? "Bitcoin" : "Lightning"}
            placeholder={"0"}
            variant="outlined"
            error={errorOutput}
            onChange={(e: any) => {
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
            value={outputSats.toString()}
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              flexDirection: "column",
              mt: 2,
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
            // label="Invoice / Address"
            placeholder={
              reverse ? "Enter BTC address" : "Paste a Lightning invoice"
            }
            multiline
            onChange={(e) => {
              setInvoice(e.target.value);
            }}
            rows={5}
            value={invoice}
            variant="outlined"
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={() => submarineSwap(invoice)}
          >
            Create Atomic Swap
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default App;
