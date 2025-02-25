// frontend/src/components/Minter.jsx  
const mintNFT = async () => {  
  const signer = await connectWallet();  
  const nftContract = new ethers.Contract(nftAddress, nftABI, signer);  
  const tx = await nftContract.mint("ipfs://CID/metadata.json");  
  await tx.wait();  
};  

const listNFT = async (tokenId, price) => {  
  const signer = await connectWallet();  
  const marketplaceContract = new ethers.Contract(marketAddress, marketABI, signer);  
  const tx = await marketplaceContract.listNFT(tokenId, price);  
  await tx.wait();  
};  
