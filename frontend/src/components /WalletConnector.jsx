import { ethers } from "ethers";

export const connectWallet = async () => {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed");
  }
  
  try {
    // This prompts the user to connect their wallet
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    
    // Check if they're on the right network
    const network = await provider.getNetwork();
    if (network.chainId !== 1) {
      throw new Error("Please switch to Ethereum Mainnet");
    }
    
    const signer = provider.getSigner();
    
    // Get the address too for convenience
    const address = await signer.getAddress();
    
    // Return both the signer and address
    return { signer, address };
  } catch (error) {
    console.error("Wallet connection error:", error);
    throw error;
  }
};
