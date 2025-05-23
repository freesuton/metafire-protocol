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



task("get-nft-price", "Get NFT price from nft price getter")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");
    const CHAIN_NAME = "Ethereum-";

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();


    const NFTOracleGetter = await hre.ethers.getContractFactory("NFTOracleGetter",{libraries: {AddressChecksumUtils: "0x4e269B02e861156A7c1BeD894558b21d5311c2c6"}});
    const nftOracleGetter = NFTOracleGetter.attach(jsonData.nftOracleGetterAddress);
    const aNFTOracleGetterProxy = await nftOracleGetter.attach(jsonData.nftOracleGetterProxyAddress);

    const nftPrice = await aNFTOracleGetterProxy.getAssetPrice("0x889fbf30d42602cF8086fd54874F5040deF086BE");
    console.log("NFT price: ", nftPrice.toString());
});

// task("get-address", "Get contract address from address provider")
//   .addParam("querystring", "bytesValue")
//   .setAction(async ( taskArgs , hre) => {


//     const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
//     const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");
//     const CHAIN_NAME = "Ethereum-";

//     // Load logic address
//     const path = './tasks/deploys/contractAddresses.json';
//     const jsonData = await loadJsonFile(path);

//     const [owner] = await hre.ethers.getSigners();


//     const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
//     const lendPoolAddressesProvider = LendPoolAddressesProvider.attach(jsonData.lendPoolAddressesProviderAddress);
    
//     const bytesValue = hre.ethers.utils.formatBytes32String("LEND_POOL")
//     const address = await lendPoolAddressesProvider.getAddress(bytesValue);
//     console.log(querystring+": ", address);

// });

task("get-mtoken-lock-period", "Update mToken lock period")
  .addParam("address", "The mToken address")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const BurnLockMTokenImpl = await hre.ethers.getContractFactory("BurnLockMToken");
    // burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();
    // await burnLockMTokenImpl.deployed();
    const burnLockMToken = BurnLockMTokenImpl.attach(taskArgs.address);

    let lockPeriod = await burnLockMToken.LOCK_PERIOD();
    console.log("Current lock period: ", lockPeriod.toString());
});

task("get-reserve-data", "Update mToken lock period")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const LendPool = await hre.ethers.getContractFactory("LendPool", {
      libraries: {
        SupplyLogic: jsonData.supplyLogicAddress,
        BorrowLogic: jsonData.borrowLogicAddress,
        LiquidateLogic: jsonData.liquidateLogicAddress,
        ReserveLogic: jsonData.reserveLogicAddress,
        NftLogic: jsonData.nftLogicAddress
      },
    });
    const lendPool = LendPool.attach(jsonData.lendPoolProxyAddress);
    const reserveData = await lendPool.getReserveData(jsonData.wETHAddress);
    console.log("reserveData: ", reserveData);
});




function loadJsonFile(filename: string) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf-8');
}