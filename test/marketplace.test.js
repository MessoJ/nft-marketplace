const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Marketplace", () => {
  let token, nft, marketplace;
  let seller, buyer;

  beforeEach(async () => {
    [seller, buyer] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MyToken");
    token = await Token.deploy();
    await token.deployed();

    const NFT = await ethers.getContractFactory("MyNFT");
    nft = await NFT.deploy();
    await nft.deployed();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy(nft.address, token.address);
    await marketplace.deployed();

    // Mint tokens for testing
    await token.transfer(buyer.address, ethers.utils.parseEther("1000"));
  });

  it("Should list and buy NFT", async () => {
    // Seller mints NFT
    await nft.connect(seller).mint("ipfs://test");
    await nft.connect(seller).approve(marketplace.address, 0);

    // Seller lists NFT
    await marketplace.connect(seller).listNFT(0, 100);
    expect(await marketplace.listings(0).price).to.equal(100);

    // Buyer approves tokens and buys
    await token.connect(buyer).approve(marketplace.address, 100);
    await marketplace.connect(buyer).buyNFT(0);

    // Check ownership
    expect(await nft.ownerOf(0)).to.equal(buyer.address);
  });
});
