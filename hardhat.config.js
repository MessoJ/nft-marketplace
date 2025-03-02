require("@nomiclabs/hardhat-waffle");
require('dotenv').config();

const fs = require('fs');
const privateKey = fs.readFileSync(".secret").toString().trim() || "0x0123456789012345678901234567890123456789012345678901234567890123";

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 1337
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [privateKey]
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [privateKey]
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  }
};
