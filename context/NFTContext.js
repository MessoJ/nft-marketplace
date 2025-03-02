import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { create as ipfsHttpClient } from 'ipfs-http-client';

import { MarketAddress, MarketAddressABI } from './constants';

const auth = `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_IPFS_PROJECT_ID}:${process.env.NEXT_PUBLIC_IPFS_PROJECT_SECRET}`).toString('base64')}`;

const client = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: auth,
  },
});

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const nftCurrency = 'ETH';

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log('No accounts found');
      }
    } catch (error) {
      console.log('Error checking if wallet is connected:', error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask');

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log('Error connecting wallet:', error);
    }
  };

  const uploadToIPFS = async (file) => {
    try {
      const added = await client.add({ content: file });
      const url = `https://infura-ipfs.io/ipfs/${added.path}`;
      return url;
    } catch (error) {
      console.log('Error uploading to IPFS:', error);
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;

    if (!name || !description || !price || !fileUrl) return;

    const data = JSON.stringify({ name, description, image: fileUrl });

    try {
      const added = await client.add(data);
      const url = `https://infura-ipfs.io/ipfs/${added.path}`;

      await createSale(url, price);

      router.push('/');
    } catch (error) {
      console.log('Error creating NFT:', error);
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const price = ethers.utils.parseUnits(formInputPrice, 'ether');
      const contract = new ethers.Contract(MarketAddress, MarketAddressABI, signer);
      const listingPrice = await contract.getListingPrice();

      const transaction = !isReselling
        ? await contract.createToken(url, price, { value: listingPrice.toString() })
        : await contract.resellToken(id, price, { value: listingPrice.toString() });

      setIsLoadingNFT(true);
      await transaction.wait();
    } catch (error) {
      console.log('Error creating sale:', error);
    }
  };

  const fetchNFTs = async () => {
    setIsLoadingNFT(false);
    
    try {
      const provider = new ethers.providers.JsonRpcProvider();
      const contract = new ethers.Contract(MarketAddress, MarketAddressABI, provider);

      const data = await contract.fetchMarketItems();

      const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const { data: { image, name, description } } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      }));

      return items;
    } catch (error) {
      console.log('Error fetching NFTs:', error);
    }
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    setIsLoadingNFT(false);

    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();

      const contract = new ethers.Contract(MarketAddress, MarketAddressABI, signer);

      const data = type === 'fetchItemsListed'
        ? await contract.fetchItemsListed()
        : await contract.fetchMyNFTs();

      const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const { data: { image, name, description } } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      }));

      return items;
    } catch (error) {
      console.log('Error fetching NFTs:', error);
    }
  };

  const buyNFT = async (nft) => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      
      const contract = new ethers.Contract(MarketAddress, MarketAddressABI, signer);
      
      const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');
      
      const transaction = await contract.createMarketSale(nft.tokenId, { value: price });
      
      setIsLoadingNFT(true);
      await transaction.wait();
      setIsLoadingNFT(false);
    } catch (error) {
      console.log('Error buying NFT:', error);
    }
  };

  return (
    <NFTContext.Provider value={{ 
      nftCurrency, 
      connectWallet, 
      currentAccount, 
      uploadToIPFS,
      createNFT,
      fetchNFTs,
      fetchMyNFTsOrListedNFTs,
      buyNFT,
      createSale,
      isLoadingNFT
    }}>
      {children}
    </NFTContext.Provider>
  );
};
