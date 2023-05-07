import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
// import '@nomiclabs/hardhat-waffle';

import "./tasks/deploys/deploy";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },

  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 5,
      gas: "auto",
      allowUnlimitedContractSize: true,
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      // gas: "auto",
      allowUnlimitedContractSize: true,
      gas: 5000000,
      gasPrice: 2000000000,
    },
    localhost:{
      
    }
  }
};

export default config;