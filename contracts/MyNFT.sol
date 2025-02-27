// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title NFT
 * @dev Implementation of ERC721 token with storage of token URIs
 * and additional management functionality
 */
contract NFT is ERC721URIStorage, ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    // Counter for token IDs
    Counters.Counter private _tokenIds;
    
    // Mapping to store token creators
    mapping(uint256 => address) private _creators;
    
    // Royalty percentage for secondary sales (in basis points, 100 = 1%)
    uint256 public royaltyPercentage = 1000; // 10%
    
    // Base URI for metadata
    string private _baseTokenURI;
    
    // Collection name and symbol
    string public collectionName;
    string public collectionSymbol;
    
    // Events
    event NFTMinted(uint256 indexed tokenId, address creator, string tokenURI);
    event RoyaltyPercentageUpdated(uint256 oldPercentage, uint256 newPercentage);
    event BaseURIUpdated(string oldURI, string newURI);
    
    /**
     * @dev Initializes the contract by setting a name and a symbol to the token collection
     * @param name Collection name
     * @param symbol Collection symbol
     * @param baseTokenURI Base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) {
        collectionName = name;
        collectionSymbol = symbol;
        _baseTokenURI = baseTokenURI;
    }
    
    /**
     * @dev Mints a new NFT with the specified token URI
     * @param tokenURI URI for the token metadata
     * @return tokenId ID of the newly minted token
     */
    function mintNFT(string memory tokenURI) external returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        _creators[newTokenId] = msg.sender;
        
        emit NFTMinted(newTokenId, msg.sender, tokenURI);
        
        return newTokenId;
    }
    
    /**
     * @dev Returns the base URI for token metadata
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Updates the base URI for token metadata
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        string memory oldURI = _baseTokenURI;
        _baseTokenURI = newBaseURI;
        
        emit BaseURIUpdated(oldURI, newBaseURI);
    }
    
    /**
     * @dev Updates the royalty percentage for secondary sales
     * @param newPercentage New royalty percentage (in basis points)
     */
    function setRoyaltyPercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= 3000, "Royalty percentage cannot exceed 30%");
        
        uint256 oldPercentage = royaltyPercentage;
        royaltyPercentage = newPercentage;
        
        emit RoyaltyPercentageUpdated(oldPercentage, newPercentage);
    }
    
    /**
     * @dev Returns the creator of a token
     * @param tokenId ID of the token
     * @return Address of the token creator
     */
    function getCreator(uint256 tokenId) external view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _creators[tokenId];
    }
    
    /**
     * @dev Returns royalty information for a token
     * @param tokenId ID of the token
     * @param salePrice Sale price of the token
     * @return Address who should receive royalties and the royalty amount
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256) {
        require(_exists(tokenId), "Token does not exist");
        
        address creator = _creators[tokenId];
        uint256 royaltyAmount = (salePrice * royaltyPercentage) / 10000;
        
        return (creator, royaltyAmount);
    }
    
    /**
     * @dev Burns a token
     * @param tokenId ID of the token to burn
     */
    function burnToken(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not owner nor approved");
        _burn(tokenId);
    }
    
    /**
     * @dev Overrides the function from ERC721Enumerable to ensure
     * compatibility with ERC721URIStorage
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * @dev Overrides the burn function to ensure compatibility with
     * both ERC721Enumerable and ERC721URIStorage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Overrides the tokenURI function to ensure compatibility with
     * both ERC721Enumerable and ERC721URIStorage
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Overrides supportsInterface to ensure compatibility with
     * both ERC721Enumerable and ERC721URIStorage
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Returns all tokens owned by a specific address
     * @param owner Address of the token owner
     * @return Array of token IDs owned by the address
     */
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }
}