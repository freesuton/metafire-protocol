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
    apiKey: "UAGAZ33ZK73A9FF386293RTTDPI354SK4K"
  }
};

export default config;