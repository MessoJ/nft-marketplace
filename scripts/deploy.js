const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Deploy first marketplace contract (if you need both)
  const NFTMarketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const nftMarketplace = await NFTMarketplace.deploy();
  await nftMarketplace.deployed();
  console.log("NFTMarketplace deployed to:", nftMarketplace.address);
  
  // Deploy Token
  const Token = await hre.ethers.getContractFactory("MyToken");
  const token = await Token.deploy();
  await token.deployed();
  console.log("Token address:", token.address);
  
  // Deploy NFT
  const NFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await NFT.deploy();
  await nft.deployed();
  console.log("NFT address:", nft.address);
  
  // Deploy Marketplace
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(nft.address, token.address);
  await marketplace.deployed();
  console.log("Marketplace address:", marketplace.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
