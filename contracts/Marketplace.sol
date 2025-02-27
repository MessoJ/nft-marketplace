// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTMarketplace is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint256 listingPrice = 0.025 ether;

    constructor() {
        owner = payable(msg.sender);
    }

    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;

    event MarketItemCreated (
        uint256 indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );
    
    event MarketItemSold (
        uint256 indexed itemId,
        address indexed buyer,
        uint256 price
    );

    // View functions
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function getMarketItem(uint256 itemId) public view returns (MarketItem memory) {
        return idToMarketItem[itemId];
    }

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        
        for (uint256 i = 0; i < itemCount; i++) {
            if (idToMarketItem[i + 1].owner == address(0)) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        
        return items;
    }

    function fetchMyNFTs() public view returns (MarketItem[] memory) {
        uint256 totalItemCount = _itemIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;

        // Count user's items
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);
        
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        
        return items;
    }

    // Create a market item (list an NFT)
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();
  
        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)), // No owner yet (set to empty address)
            price,
            false
        );

        // Transfer NFT ownership to the marketplace contract
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            false
        );
    }

    // Buy an NFT (create a market sale)
    function createMarketSale(
        address nftContract,
        uint256 itemId
    ) public payable nonReentrant {
        uint256 price = idToMarketItem[itemId].price;
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        address payable seller = idToMarketItem[itemId].seller;
        
        require(msg.value == price, "Please submit the asking price to complete the purchase");
        require(!idToMarketItem[itemId].sold, "Item is already sold");
        require(idToMarketItem[itemId].owner == address(0), "Item is not for sale");

        // Update state before external calls (prevents reentrancy)
        idToMarketItem[itemId].owner = payable(msg.sender);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        
        // Transfer NFT to buyer
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        
        // Transfer payment to seller
        (bool sentToSeller, ) = seller.call{value: msg.value}("");
        require(sentToSeller, "Failed to send payment to seller");
        
        // Transfer listing fee to contract owner
        (bool sentToOwner, ) = owner.call{value: listingPrice}("");
        require(sentToOwner, "Failed to send listing fee to marketplace owner");
        
        emit MarketItemSold(itemId, msg.sender, price);
    }
    
    // Allow marketplace owner to update listing price
    function updateListingPrice(uint256 _listingPrice) public {
        require(msg.sender == owner, "Only marketplace owner can update listing price");
        listingPrice = _listingPrice;
    }
    
    // Allow sellers to cancel listings and get their NFTs back
    function cancelMarketItem(uint256 itemId) public nonReentrant {
        require(idToMarketItem[itemId].seller == msg.sender, "Only seller can cancel listing");
        require(!idToMarketItem[itemId].sold, "Sold items cannot be canceled");
        
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        address nftContract = idToMarketItem[itemId].nftContract;
        
        // Transfer NFT back to seller
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        
        // Update item state
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        
        // Note: Listing fee is not refunded as per marketplace policy
    }
}