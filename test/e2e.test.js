const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace E2E", function() {
  // We'll declare variables here so they're accessible throughout all tests
  let nftContract;
  let marketplaceContract;
  let tokenContract;
  let owner;
  let seller;
  let buyer;
  
  // This runs before each test, setting up a fresh environment
  beforeEach(async function() {
    // Get signers (test accounts)
    [owner, seller, buyer] = await ethers.getSigners();
    
    // Deploy the NFT contract
    const NFT = await ethers.getContractFactory("MyNFT");
    nftContract = await NFT.deploy();
    await nftContract.deployed();
    
    // Deploy the token contract (if your marketplace uses a specific token)
    const Token = await ethers.getContractFactory("MyToken");
    tokenContract = await Token.deploy();
    await tokenContract.deployed();
    
    // Deploy the marketplace contract
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplaceContract = await Marketplace.deploy(nftContract.address, tokenContract.address);
    await marketplaceContract.deployed();
    
    // If needed, set approvals for the marketplace to handle NFTs
    await nftContract.connect(seller).setApprovalForAll(marketplaceContract.address, true);
  });
  
  it("should mint and list an NFT", async function() {
    // 1. Mint an NFT to the seller
    const tokenURI = "ipfs://QmExample..."; // Your IPFS URI with metadata
    await nftContract.connect(seller).mint(tokenURI);
    
    // 2. Check that the NFT was minted correctly
    expect(await nftContract.ownerOf(1)).to.equal(seller.address);
    expect(await nftContract.tokenURI(1)).to.equal(tokenURI);
    
    // 3. Set a price for listing
    const listingPrice = ethers.utils.parseEther("1.0"); // 1 ETH
    
    // 4. List the NFT on the marketplace
    await marketplaceContract.connect(seller).listItem(
      nftContract.address,
      1, // token ID
      listingPrice
    );
    
    // 5. Verify the NFT is now listed
    const listing = await marketplaceContract.getListing(nftContract.address, 1);
    expect(listing.seller).to.equal(seller.address);
    expect(listing.price).to.equal(listingPrice);
    expect(listing.isActive).to.be.true;
    
    // Additional checks you might want to include:
    // - Verify events were emitted correctly
    // - Check marketplace state changes
    // - Verify NFT ownership hasn't changed yet (until purchased)
  });
});
