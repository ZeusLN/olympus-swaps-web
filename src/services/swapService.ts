import axios from "axios";

// Base URL for API
const API_BASE_URL = "https://api.testnet.boltz.exchange/v2";

// Fetch submarine swap fees
export const getSubmarineSwapFees = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/swap/submarine`);
    return response.data.BTC.BTC;
  } catch (error) {
    console.error("Error fetching submarine swap fees:", error);
    throw error;
  }
};

// Fetch reverse swap fees
export const getReverseSwapFees = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/swap/reverse`);
    return response.data.BTC.BTC;
  } catch (error) {
    console.error("Error fetching reverse swap fees:", error);
    throw error;
  }
};
