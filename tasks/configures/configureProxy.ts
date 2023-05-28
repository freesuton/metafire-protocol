import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
// import { ethers } from "hardhat";
require('dotenv').config();
const fs = require('fs');
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate, DebtToken, BurnLockMToken} from "../../typechain-types/contracts/protocol"
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../../typechain-types/contracts/libraries/logic"
import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721} from "../../typechain-types/contracts/mock";
import { BigNumber } from "ethers";

let lendPoolConfigurator: LendPoolConfigurator;

let burnLockMTokenImpl: BurnLockMToken;
let debtTokenImpl: DebtToken;
let mintableERC721: MintableERC721;

task("init-proxy-contracts", "Init the reserve")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    const lendPoolAddressesProvider = LendPoolAddressesProvider.attach(jsonData.lendPoolAddressesProviderAddress);


    const LendPool = await hre.ethers.getContractFactory("LendPool", {
        libraries: {
          SupplyLogic: jsonData.supplyLogicAddress,
          BorrowLogic: jsonData.borrowLogicAddress,
          LiquidateLogic: jsonData.liquidateLogicAddress,
          ReserveLogic: jsonData.reserveLogicAddress,
          NftLogic: jsonData.nftLogicAddress
        },
      });
    const  lendPool = LendPool.attach(jsonData.lendPoolAddress);
    const  aLendPoolProxy = await lendPool.attach(jsonData.lendPoolProxyAddress);
    const LendPoolLoan = await hre.ethers.getContractFactory("LendPoolLoan");
    const lendPoolLoan = LendPoolLoan.attach(jsonData.lendPoolLoanAddress);
    const aLendPoolLoanProxy = await lendPoolLoan.attach(jsonData.lendPoolLoanProxyAddress);
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
        libraries: {
          ConfiguratorLogic: jsonData.configuratorLogicAddress,
        },
      });
    const lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);
    const aLendPoolConfiguratorProxy = await lendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    const BNFTRegistry = await hre.ethers.getContractFactory("BNFTRegistry");
    const bNFTRegistry = BNFTRegistry.attach(jsonData.bNFTRegistryAddress);
    const aBNFTRegistryProxy = await bNFTRegistry.attach(jsonData.bNFTRegistryProxyAddress);

    /**
     * Init contracts
     */
    await aLendPoolProxy.initialize(lendPoolAddressesProvider.address);
    await aLendPoolLoanProxy.initialize(lendPoolAddressesProvider.address);
    await aLendPoolConfiguratorProxy.initialize(lendPoolAddressesProvider.address);

    // Init BNFT Registry
    await aBNFTRegistryProxy.initialize(jsonData.bNFTAddress,"M","M");
  // Create Proxy and init IMPL
    await aBNFTRegistryProxy.createBNFT(jsonData.mintableERC721Address);

});







function loadJsonFile(filename: string) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf-8');
}