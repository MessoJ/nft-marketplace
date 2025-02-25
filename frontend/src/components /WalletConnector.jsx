// frontend/src/components/WalletConnector.jsx  
import { ethers } from "ethers";  

const connectWallet = async () => {  
  if (window.ethereum) {  
    const provider = new ethers.providers.Web3Provider(window.ethereum);  
    await provider.send("eth_requestAccounts", []);  
    const signer = provider.getSigner();  
    return signer;  
  } else {  
    alert("Install MetaMask!");  
  }  
};  
