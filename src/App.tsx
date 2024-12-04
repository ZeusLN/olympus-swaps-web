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

import {
  getSubmarineSwapFees,
  getReverseSwapFees,
} from "./services/swapService";

const App: React.FC = () => {
  const [inputSats, setInputSats] = useState(0);
  const [outputSats, setOutputSats] = useState(0);
  const [serviceFeeSats, setserviceFeeSats] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [subInfo, setSubInfo] = useState<any>(null);
  const [reverseInfo, setReverseInfo] = useState<any>(null);
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

  const errorInput = (inputSats !== 0 && inputSats < min) || inputSats > max;
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
            Send min: {new BigNumber(min).toString()} sats
          </Typography>
          <Typography>
            Send max: {new BigNumber(max).toString()} sats
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={reverse ? "Lightning" : "Bitcoin"}
            placeholder={
              reverse ? "Enter Lightning invoice" : "Enter BTC address"
            }
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
            placeholder={
              reverse ? "Enter BTC address" : "Enter Lightning invoice"
            }
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
              Network Fee: {networkFee.toString()} sats
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
            rows={3}
            variant="outlined"
          />
          <Button variant="contained" color="primary" fullWidth>
            Create Atomic Swap
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default App;
