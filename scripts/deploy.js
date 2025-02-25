const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy Token
  const Token = await hre.ethers.getContractFactory("MyToken");
  const token = await Token.deploy();
  await token.deployed();

  // Deploy NFT
  const NFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await NFT.deploy();
  await nft.deployed();

  // Deploy Marketplace
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const marketplace = await Marketplace.deploy(nft.address, token.address);
  await marketplace.deployed();

  console.log("Token address:", token.address);
  console.log("NFT address:", nft.address);
  console.log("Marketplace address:", marketplace.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
