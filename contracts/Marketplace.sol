// contracts/Marketplace.sol  
pragma solidity ^0.8.0;  
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";  

contract Marketplace is ReentrancyGuard {  
    struct Listing {  
        address seller;  
        uint256 price;  
        address paymentToken; // ERC-20 address  
        bool active;  
    }  

    mapping(uint256 => Listing) public listings;  
    MyNFT public nftContract;  
    MyToken public tokenContract;  

    constructor(address _nft, address _token) {  
        nftContract = MyNFT(_nft);  
        tokenContract = MyToken(_token);  
    }  

    function listNFT(uint256 _tokenId, uint256 _price) public {  
        require(nftContract.ownerOf(_tokenId) == msg.sender, "Not owner");  
        listings[_tokenId] = Listing(msg.sender, _price, address(tokenContract), true);  
    }  

    function buyNFT(uint256 _tokenId) public nonReentrant {  
        Listing memory listing = listings[_tokenId];  
        require(listing.active, "Not for sale");  

        // Transfer ERC-20 tokens from buyer to seller  
        tokenContract.transferFrom(msg.sender, listing.seller, listing.price);  

        // Transfer NFT to buyer  
        nftContract.safeTransferFrom(listing.seller, msg.sender, _tokenId);  

        delete listings[_tokenId];  
    }  
}  
