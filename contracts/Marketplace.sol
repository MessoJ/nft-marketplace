// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title NFTMarketplace
 * @dev Implements a marketplace for trading NFTs with listing, buying, and cancellation functionality
 */
contract NFTMarketplace is ReentrancyGuard, Ownable {
    using Counters for Counters.Counter;
    
    // Counter for generating unique listing IDs
    Counters.Counter private _listingIds;
    
    // Marketplace fee percentage (in basis points, 100 = 1%)
    uint256 public marketplaceFeePercentage = 250; // 2.5%
    
    // Structure to store listing information
    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
        bool active;
    }
    
    // Mapping from listingId to Listing
    mapping(uint256 => Listing) private _listings;
    
    // Events
    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price
    );
    
    event NFTSold(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price
    );
    
    event NFTListingCancelled(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId
    );
    
    event MarketplaceFeeUpdated(
        uint256 oldFee,
        uint256 newFee
    );
    
    /**
     * @dev Creates a new listing for an NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID of the NFT
     * @param price Price at which the NFT is being listed
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant {
        require(price > 0, "Price must be greater than zero");
        
        // Transfer NFT from seller to marketplace contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        // Increment listing ID
        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        
        // Create listing
        _listings[listingId] = Listing(
            listingId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            false,
            true
        );
        
        emit NFTListed(listingId, nftContract, tokenId, msg.sender, address(0), price);
    }
    
    /**
     * @dev Executes a purchase of a listed NFT
     * @param listingId ID of the listing to purchase
     */
    function buyNFT(uint256 listingId) external payable nonReentrant {
        Listing storage listing = _listings[listingId];
        
        require(listing.listingId > 0, "Listing does not exist");
        require(listing.active, "Listing is not active");
        require(!listing.sold, "NFT already sold");
        require(msg.value >= listing.price, "Insufficient funds sent");
        
        // Calculate and transfer marketplace fee
        uint256 marketplaceFee = (listing.price * marketplaceFeePercentage) / 10000;
        uint256 sellerProceeds = listing.price - marketplaceFee;
        
        // Update listing state
        listing.sold = true;
        listing.active = false;
        listing.owner = payable(msg.sender);
        
        // Transfer NFT to buyer
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        // Transfer funds to seller
        (bool success, ) = listing.seller.call{value: sellerProceeds}("");
        require(success, "Failed to send payment to seller");
        
        // Refund excess payment if any
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Failed to refund excess payment");
        }
        
        emit NFTSold(listingId, listing.nftContract, listing.tokenId, listing.seller, msg.sender, listing.price);
    }
    
    /**
     * @dev Cancels an active listing
     * @param listingId ID of the listing to cancel
     */
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = _listings[listingId];
        
        require(listing.listingId > 0, "Listing does not exist");
        require(listing.active, "Listing is not active");
        require(!listing.sold, "NFT already sold");
        require(listing.seller == msg.sender, "Only seller can cancel listing");
        
        // Update listing state
        listing.active = false;
        
        // Transfer NFT back to seller
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        emit NFTListingCancelled(listingId, listing.nftContract, listing.tokenId);
    }
    
    /**
     * @dev Updates the marketplace fee percentage
     * @param newFeePercentage New fee percentage (in basis points)
     */
    function setMarketplaceFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 1000, "Fee percentage cannot exceed 10%");
        
        uint256 oldFee = marketplaceFeePercentage;
        marketplaceFeePercentage = newFeePercentage;
        
        emit MarketplaceFeeUpdated(oldFee, newFeePercentage);
    }
    
    /**
     * @dev Withdraws accumulated marketplace fees to the owner
     */
    function withdrawMarketplaceFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Failed to withdraw marketplace fees");
    }
    
    /**
     * @dev Returns details of a specific listing
     * @param listingId ID of the listing to query
     * @return Listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return _listings[listingId];
    }
    
    /**
     * @dev Returns the current number of listings (including sold and inactive)
     * @return Total number of listings
     */
    function getListingCount() external view returns (uint256) {
        return _listingIds.current();
    }
    
    /**
     * @dev Returns a batch of listings within a range
     * @param start Starting index
     * @param count Number of listings to return
     * @return Array of listings
     */
    function getListingBatch(uint256 start, uint256 count) external view returns (Listing[] memory) {
        require(start > 0 && start <= _listingIds.current(), "Invalid start index");
        require(count > 0, "Count must be greater than zero");
        
        uint256 end = start + count - 1;
        if (end > _listingIds.current()) {
            end = _listingIds.current();
        }
        
        Listing[] memory batchListings = new Listing[](end - start + 1);
        
        for (uint256 i = start; i <= end; i++) {
            batchListings[i - start] = _listings[i];
        }
        
        return batchListings;
    }
    
    /**
     * @dev Returns active listings by a specific seller
     * @param seller Address of the seller
     * @return Array of active listings by the seller
     */
    function getListingsBySeller(address seller) external view returns (Listing[] memory) {
        uint256 totalListings = _listingIds.current();
        uint256 sellerListingCount = 0;
        
        // Count seller's active listings
        for (uint256 i = 1; i <= totalListings; i++) {
            if (_listings[i].seller == seller && _listings[i].active && !_listings[i].sold) {
                sellerListingCount++;
            }
        }
        
        Listing[] memory sellerListings = new Listing[](sellerListingCount);
        uint256 index = 0;
        
        // Populate array with seller's listings
        for (uint256 i = 1; i <= totalListings && index < sellerListingCount; i++) {
            if (_listings[i].seller == seller && _listings[i].active && !_listings[i].sold) {
                sellerListings[index] = _listings[i];
                index++;
            }
        }
        
        return sellerListings;
    }
}