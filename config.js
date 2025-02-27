// config.js - Environment configuration management

// Import dotenv to load environment variables
require('dotenv').config();

const NETWORKS = {
  // Mainnet
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: process.env.MAINNET_RPC_URL,
    contracts: {
      marketplace: process.env.MAINNET_MARKETPLACE_ADDRESS,
      nft: process.env.MAINNET_NFT_ADDRESS,
    }
  },
  
  // Testnet
  goerli: {
    chainId: 5,
    name: 'Goerli Testnet',
    currency: 'ETH',
    explorerUrl: 'https://goerli.etherscan.io',
    rpcUrl: process.env.GOERLI_RPC_URL,
    contracts: {
      marketplace: process.env.GOERLI_MARKETPLACE_ADDRESS,
      nft: process.env.GOERLI_NFT_ADDRESS,
    }
  },
  
  // Local development
  hardhat: {
    chainId: 31337,
    name: 'Hardhat Local',
    currency: 'ETH',
    explorerUrl: '',
    rpcUrl: 'http://localhost:8545',
    contracts: {
      marketplace: process.env.LOCAL_MARKETPLACE_ADDRESS,
      nft: process.env.LOCAL_NFT_ADDRESS,
    }
  }
};

// IPFS configuration
const IPFS_CONFIG = {
  gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
  pinningService: process.env.IPFS_PINNING_SERVICE || 'pinata',
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretKey: process.env.PINATA_SECRET_KEY
};

// Default network based on environment
const DEFAULT_NETWORK = process.env.NODE_ENV === 'production' 
  ? 'ethereum' 
  : (process.env.NODE_ENV === 'test' ? 'goerli' : 'hardhat');

// Application settings
const APP_CONFIG = {
  appName: 'NFT Marketplace',
  appDescription: 'Buy, sell, and create unique digital assets',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  supportEmail: process.env.SUPPORT_EMAIL || 'support@nftmarketplace.com',
  analytics: {
    googleAnalyticsId: process.env.GA_ID
  },
  social: {
    twitter: process.env.TWITTER_HANDLE || 'nftmarketplace',
    discord: process.env.DISCORD_URL,
    telegram: process.env.TELEGRAM_URL
  },
  features: {
    enableCreation: process.env.ENABLE_NFT_CREATION !== 'false',
    enableBidding: process.env.ENABLE_BIDDING === 'true',
    enableAuctions: process.env.ENABLE_AUCTIONS === 'true'
  }
};

// Marketplace settings
const MARKETPLACE_CONFIG = {
  listingPrice: process.env.LISTING_PRICE || '0.025',
  listingCurrency: 'ETH',
  supportedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/mp3', 'video/mp4'],
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '100000000', 10), // 100MB default
  royaltyBasisPoints: parseInt(process.env.ROYALTY_BASIS_POINTS || '250', 10), // 2.5% default
  ipfsConfig: IPFS_CONFIG
};

module.exports = {
  networks: NETWORKS,
  defaultNetwork: NETWORKS[DEFAULT_NETWORK],
  app: APP_CONFIG,
  marketplace: MARKETPLACE_CONFIG,
  
  // Helper method to get current network based on chain ID
  getNetworkByChainId: (chainId) => {
    return Object.values(NETWORKS).find(network => network.chainId === chainId);
  }
};

// Example .env file structure
/*
# Network RPC URLs
MAINNET_RPC_URL=https://mainnet.infura.io/v3/your-api-key
GOERLI_RPC_URL=https://goerli.infura.io/v3/your-api-key

# Contract Addresses
MAINNET_MARKETPLACE_ADDRESS=0x...
MAINNET_NFT_ADDRESS=0x...
GOERLI_MARKETPLACE_ADDRESS=0x...
GOERLI_NFT_ADDRESS=0x...
LOCAL_MARKETPLACE_ADDRESS=0x...
LOCAL_NFT_ADDRESS=0x...

# IPFS Configuration
IPFS_GATEWAY=https://ipfs.io/ipfs/
IPFS_PINNING_SERVICE=pinata
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET_KEY=your-pinata-secret-key

# App Configuration
APP_URL=https://nftmarketplace.com
SUPPORT_EMAIL=support@nftmarketplace.com
GA_ID=UA-XXXXXXXXX-X

# Social Media
TWITTER_HANDLE=nftmarketplace
DISCORD_URL=https://discord.gg/nftmarketplace
TELEGRAM_URL=https://t.me/nftmarketplace

# Feature Flags
ENABLE_NFT_CREATION=true
ENABLE_BIDDING=false
ENABLE_AUCTIONS=false

# Marketplace Settings
LISTING_PRICE=0.025
MAX_FILE_SIZE=100000000
ROYALTY_BASIS_POINTS=250
*/