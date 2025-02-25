import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function Listings({ marketplaceAddress, marketplaceABI }) {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const loadListings = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(marketplaceAddress, marketplaceABI, provider);
      // Fetch active listings (simplified example)
      const listedNFTs = await contract.getAllListings();
      setListings(listedNFTs);
    };
    loadListings();
  }, []);

  return (
    <div>
      {listings.map((listing) => (
        <div key={listing.tokenId}>
          <h3>NFT #{listing.tokenId}</h3>
          <p>Price: {listing.price} PLAY</p>
          <button>Buy</button>
        </div>
      ))}
    </div>
  );
}
