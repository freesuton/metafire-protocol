import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
// import '@nomiclabs/hardhat-etherscan';
// import '@nomiclabs/hardhat-waffle';
require("hardhat-contract-sizer");
// import "@nomicfoundation/hardhat-verify";
import "./tasks/deploys/deploy";
import "./tasks/configures/configure";
// import "./tasks/configures/configureProxy";
import "./tasks/dataGetter/dataGetter";
// import "./tasks/configures/migrateOracle";
import "./tasks/protocolOperation/protocolOperation";
import "hardhat-gas-reporter";

const proxyUrl = "http://127.0.0.1:7890" 
const { ProxyAgent, setGlobalDispatcher } = require("undici") ;
const proxyAgent = new ProxyAgent(proxyUrl) ;
setGlobalDispatcher(proxyAgent);

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      metadata:{
        bytecodeHash: "none"
      }
    }
  },

  networks: {
    hardhat: {
      chainId: 1337,
      gas: "auto",
      gasPrice: "auto",
      allowUnlimitedContractSize: true
    },
    mainnet: {
      url: process.env.MAINNET_URL || "",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gas: "auto",
      gasPrice: "auto", // 15 gwei
      allowUnlimitedContractSize: true,
      // timeout: 200000
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
      allowUnlimitedContractSize: true,
      gas: "auto",
      gasPrice: "auto",
    },
    localhost:{
      
    }
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter: {
    currency: 'USD',  // Currency in which gas prices are displayed (optional)
    gasPrice: 11,     // Denominated in gwei (optional)
    // outputFile: 'gas-reporter-output.txt', // Save the report to a file (optional)
    enabled: false
    // ... other options
  }
};

export default config;