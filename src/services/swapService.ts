import axios from "axios";
import zkpInit from "@vulpemventures/secp256k1-zkp";
import { crypto } from "bitcoinjs-lib";
import bolt11 from "bolt11";
import { Musig, SwapTreeSerializer, TaprootUtils } from "boltz-core";
import { randomBytes } from "crypto";

// Base URL for API
export const API_BASE_URL = "https://api.testnet.boltz.exchange/v2";

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

export const createSubmarineSwap = async (invoice: string, publicKey: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/swap/submarine`, {
      invoice,
      to: "BTC",
      from: "BTC",
      refundPublicKey: publicKey,
    });
    return response.data;
  } catch (error: any) {
    console.error("Error creating swap:", error);
    if (error.response && error.response.data) {
      return error.response.data;
    }
    throw new Error("Unexpected error occurred while creating swap.");
  }
};

// Get claim transaction details
export const getClaimTransactionDetails = async (swapId: string) => {
  return await axios.get(`${API_BASE_URL}/swap/submarine/${swapId}/claim`);
};

// Validates the preimage from Boltz against the invoice hash.
export const validatePreimage = (
  invoice: string,
  preimage: string
): boolean => {
  const invoicePreimageHash = Buffer.from(
    bolt11.decode(invoice).tags.find((tag) => tag.tagName === "payment_hash")!
      .data as string,
    "hex"
  );

  const boltzPreimageHash: any = crypto.sha256(Buffer.from(preimage, "hex"));
  return boltzPreimageHash.equals(invoicePreimageHash);
};

export const createClaimTransaction = async (
  claimTxDetails: any,
  createdResponse: any,
  keys: any
) => {
  try {
    // Extract Boltz public key
    const boltzPublicKey = Buffer.from(createdResponse.claimPublicKey, "hex");

    // Initialize Musig
    const musig = new Musig(await zkpInit(), keys, randomBytes(32), [
      boltzPublicKey,
      Buffer.from(keys.publicKey),
    ]);

    // Tweak Musig with the Taproot tree
    TaprootUtils.tweakMusig(
      musig,
      SwapTreeSerializer.deserializeSwapTree(createdResponse.swapTree).tree
    );

    // Aggregate nonces and initialize session
    musig.aggregateNonces([
      [boltzPublicKey, Buffer.from(claimTxDetails.pubNonce, "hex")],
    ]);
    musig.initializeSession(Buffer.from(claimTxDetails.transactionHash, "hex"));

    // Prepare data for the claim transaction
    const claimData = {
      pubNonce: Buffer.from(musig.getPublicNonce()).toString("hex"),
      partialSignature: Buffer.from(musig.signPartial()).toString("hex"),
    };

    // Post claim transaction using Axios
    await axios.post(
      `${API_BASE_URL}/swap/submarine/${createdResponse.id}/claim`,
      claimData
    );

    console.log("Claim transaction submitted successfully.");
  } catch (error) {
    console.error("Error in createClaimTransaction:", error);
    throw error;
  }
};
