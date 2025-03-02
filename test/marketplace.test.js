const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace", function () {
  let NFTMarketplace;
  let marketplace;
  let NFT;
  let nft;
  let listingPrice;
  let owner;
  let addr1;
  let addr2;
  
  beforeEach(async function () {
    // Get contract factories
    NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    NFT = await ethers.getContractFactory("NFT");
    
    // Get signers
    [owner, addr1, addr2] = await ethers.getSigners();
    
    // Deploy contracts
    marketplace = await NFTMarketplace.deploy();
    await marketplace.deployed();
    
    nft = await NFT.deploy(marketplace.address);
    await nft.deployed();
    
    // Get listing price
    listingPrice = await marketplace.getListingPrice();
    listingPrice = listingPrice.toString();
  });
  
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await marketplace.owner()).to.equal(owner.address);
    });
    
    it("Should set the right listing price", async function () {
      expect(await marketplace.getListingPrice()).to.equal(ethers.utils.parseEther("0.025"));
    });
  });
  
  describe("Creating market items", function () {
    it("Should create and list a new token", async function () {
      // Create a token
      await nft.createToken("https://example.com/token/1");
      
      // List the token in the marketplace
      const price = ethers.utils.parseEther("1");
      await marketplace.createMarketItem(
        nft.address,
        1,
        price,
        { value: listingPrice }
      );
      
      // Check the market item was created correctly
      const item = await marketplace.getMarketItem(1);
      expect(item.itemId).to.equal(1);
      expect(item.nftContract).to.equal(nft.address);
      expect(item.tokenId).to.equal(1);
      expect(item.seller).to.equal(owner.address);
      expect(item.owner).to.equal(ethers.constants.AddressZero); // Not sold yet
      expect(item.price).to.equal(price);
      expect(item.sold).to.equal(false);
    });
    
    it("Should fail if price is zero", async function () {
      await nft.createToken("https://example.com/token/1");
      
      await expect(
        marketplace.createMarketItem(
          nft.address,
          1,
          0, // Zero price
          { value: listingPrice }
        )
      ).to.be.revertedWith("Price must be at least 1 wei");
    });
    
    it("Should fail if listing price is not paid", async function () {
      await nft.createToken("https://example.com/token/1");
      
      await expect(
        marketplace.createMarketItem(
          nft.address,
          1,
          ethers.utils.parseEther("1"),
          { value: 0 } // Not paying listing price
        )
      ).to.be.revertedWith("Price must be equal to listing price");
    });
  });
  
  describe("Creating market sales", function () {
    beforeEach(async function () {
      // Create and list a token before each test
      await nft.createToken("https://example.com/token/1");
      const price = ethers.utils.parseEther("1");
      await marketplace.createMarketItem(
        nft.address,
        1,
        price,
        { value: listingPrice }
      );
    });
    
    it("Should execute a market sale", async function () {
      const price = ethers.utils.parseEther("1");
      
      // Get initial balances
      const initialSellerBalance = await ethers.provider.getBalance(owner.address);
      
      // Buy the item
      await marketplace.connect(addr1).createMarketSale(
        nft.address,
        1,
        { value: price }
      );
      
      // Check the item is now sold
      const item = await marketplace.getMarketItem(1);
      expect(item.owner).to.equal(addr1.address);
      expect(item.sold).to.equal(true);
      
      // Check NFT ownership
      expect(await nft.ownerOf(1)).to.equal(addr1.address);
      
      // Check seller received payment (approximately, accounting for gas)
      const finalSellerBalance = await ethers.provider.getBalance(owner.address);
      expect(finalSellerBalance.sub(initialSellerBalance))
        .to.be.closeTo(price, ethers.utils.parseEther("0.01"));
    });
    
    it("Should fail if incorrect price is paid", async function () {
      const incorrectPrice = ethers.utils.parseEther("0.5"); // Half the price
      
      await expect(
        marketplace.connect(addr1).createMarketSale(
          nft.address,
          1,
          { value: incorrectPrice }
        )
      ).to.be.revertedWith("Please submit the asking price to complete the purchase");
    });
  });
  
  describe("Fetching market items", function () {
    beforeEach(async function () {
      // Create multiple tokens and list them
      for (let i = 1; i <= 3; i++) {
        await nft.createToken(`https://example.com/token/${i}`);
        const price = ethers.utils.parseEther(i.toString());
        await marketplace.createMarketItem(
          nft.address,
          i,
          price,
          { value: listingPrice }
        );
      }
      
      // Buy one item
      await marketplace.connect(addr1).createMarketSale(
        nft.address,
        2, // Second item
        { value: ethers.utils.parseEther("2") }
      );
    });
    
    it("Should fetch all unsold market items", async function () {
      const items = await marketplace.fetchMarketItems();
      
      // Should have 2 unsold items (out of 3)
      expect(items.length).to.equal(2);
      
      // Check details of first item
      expect(items[0].itemId).to.equal(1);
      expect(items[0].sold).to.equal(false);
      
      // Check details of second item
      expect(items[1].itemId).to.equal(3);
      expect(items[1].sold).to.equal(false);
    });
    
    it("Should fetch owned NFTs", async function () {
      // Addr1 bought item #2
      const myNFTs = await marketplace.connect(addr1).fetchMyNFTs();
      
      expect(myNFTs.length).to.equal(1);
      expect(myNFTs[0].itemId).to.equal(2);
      expect(myNFTs[0].owner).to.equal(addr1.address);
    });
  });
  
  describe("Canceling listings", function() {
    beforeEach(async function () {
      // Create and list a token
      await nft.createToken("https://example.com/token/1");
      const price = ethers.utils.parseEther("1");
      await marketplace.createMarketItem(
        nft.address,
        1,
        price,
        { value: listingPrice }
      );
    });
    
    it("Should allow seller to cancel listing", async function() {
      // Cancel the listing
      await marketplace.cancelMarketItem(1);
      
      // Check NFT returned to seller
      expect(await nft.ownerOf(1)).to.equal(owner.address);
      
      // Check item is now marked as sold
      const item = await marketplace.getMarketItem(1);
      expect(item.sold).to.equal(true);
    });
    
    it("Should not allow non-sellers to cancel listing", async function() {
      await expect(
        marketplace.connect(addr1).cancelMarketItem(1)
      ).to.be.revertedWith("Only seller can cancel listing");
    });
    it("should fail to buy NFT with insufficient funds", async () => {
    await expect(nftMarketplace.buyNFT(1, { value: 0 })).to.be.revertedWith("Insufficient funds");
    });
  });
});
