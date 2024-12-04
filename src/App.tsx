import React, { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Button,
  IconButton,
  Card,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

const App: React.FC = () => {
  const [reverse, setReverse] = useState(false);

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
          maxWidth: 400,
          width: "100%",
        }}
      >
        <Typography variant="h5" align="center" sx={{ mb: 3 }}>
          Create Atomic Swap
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label={reverse ? "Lightning" : "Bitcoin"}
            placeholder={
              reverse ? "Enter Lightning invoice" : "Enter BTC address"
            }
            variant="outlined"
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
          />
          <TextField
            label="Invoice / Address"
            placeholder={
              reverse ? "Enter BTC address" : "Paste a Lightning invoice"
            }
            multiline
            rows={3}
            variant="outlined"
          />
          <Button variant="contained" color="primary" fullWidth>
            Submit
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default App;
