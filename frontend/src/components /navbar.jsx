import { ethers } from "ethers";

export default function Navbar() {
  const connectWallet = async () => {
    if (window.ethereum) {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      return provider.getSigner();
    } else {
      alert("Install MetaMask!");
    }
  };

  return (
    <nav>
      <button onClick={connectWallet}>Connect Wallet</button>
    </nav>
  );
}
