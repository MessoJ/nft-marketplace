// contracts/MyNFT.sol  
pragma solidity ^0.8.0;  
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";  
import "@openzeppelin/contracts/interfaces/IERC2981.sol";  

contract MyNFT is ERC721, IERC2981 {  
    uint256 public tokenCounter;  
    address public royaltyReceiver;  
    uint256 public royaltyPercentage;  

    constructor() ERC721("GameItem", "GITEM") {  
        royaltyReceiver = msg.sender;  
        royaltyPercentage = 10; // 10%  
    }  

    function mint(string memory _tokenURI) public {  
        _safeMint(msg.sender, tokenCounter);  
        tokenCounter++;  
    }  

    // EIP-2981 Royalty Info  
    function royaltyInfo(uint256, uint256 _salePrice) external view override  
        returns (address receiver, uint256 royaltyAmount) {  
        return (royaltyReceiver, (_salePrice * royaltyPercentage) / 100);  
    }  
}  
