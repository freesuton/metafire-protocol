import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
// import { ethers } from "hardhat";
require('dotenv').config();
const fs = require('fs');
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate, DebtToken, BurnLockMToken, WETHGateway, NFTOracleGetter} from "../../typechain-types/contracts/protocol"
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../../typechain-types/contracts/libraries/logic"
import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721,MockDIAOracle} from "../../typechain-types/contracts/mock";
import {MetaFireProxyAdmin, MetaFireUpgradeableProxy} from "../../typechain-types/contracts/libraries/proxy";
import { BigNumber } from "ethers";


const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
const ONE_DAY = 3600 * 24;
const ONE_MONTH = 3600 * 24 * 30;
const ONE_GWEI = 1_000_000_000;

// Proxy
let metaFireProxyAdmin: MetaFireProxyAdmin;
let metaFireUpgradeableProxy: MetaFireUpgradeableProxy;

// Libraries
let validationLogic: any;
let supplyLogic: SupplyLogic;
let borrowLogic: BorrowLogic;
let liquidateLogic: LiquidateLogic;
let reserveLogic: ReserveLogic;
let nftLogic: any;
let configuratorLogic: ConfiguratorLogic;

// Main
let lendPool: LendPool;
let lendPoolLoan: LendPoolLoan;
let lendPoolConfigurator: LendPoolConfigurator;
let lendPoolAddressesProvider: LendPoolAddressesProvider;
let interestRate: InterestRate;

// Sub
let wETH: WETH9Mocked;
let burnLockMTokenImpl: BurnLockMToken;
let debtTokenImpl: DebtToken;
let mintableERC721: MintableERC721;
let bNFT: any;
let bNFTRegistry: any;
let mockNFTOracle: MockNFTOracle;
let mockDIAOracle: MockDIAOracle;;
let nftOracleGetter: NFTOracleGetter
let mockReserveOracle: MockReserveOracle;





function loadJsonFile(filename: string) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf-8');
}

function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}





task("deploy-libraries", "Deploy the logic library contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {
    console.log("Start to deploy");


    const [owner, addr1] = await hre.ethers.getSigners();

    const ValidationLogic = await hre.ethers.getContractFactory("ValidationLogic");
    validationLogic = await ValidationLogic.deploy();
    await validationLogic.deployed();
    
    const SupplyLogic = await hre.ethers.getContractFactory("SupplyLogic", {libraries: {ValidationLogic: validationLogic.address }});
    supplyLogic = await SupplyLogic.deploy();
    await supplyLogic.deployed();
    
    const BorrowLogic = await hre.ethers.getContractFactory("BorrowLogic", {libraries: {ValidationLogic: validationLogic.address}});
    borrowLogic = await BorrowLogic.deploy();
    await borrowLogic.deployed();

    const LiquidateLogic = await hre.ethers.getContractFactory("LiquidateLogic", {libraries: {ValidationLogic: validationLogic.address}});
    liquidateLogic = await LiquidateLogic.deploy();
    await liquidateLogic.deployed();


    const ReserveLogic = await hre.ethers.getContractFactory("ReserveLogic");
    reserveLogic = await ReserveLogic.deploy();
    await reserveLogic.deployed();
    
    const NftLogic = await hre.ethers.getContractFactory("NftLogic");
    nftLogic = await NftLogic.deploy();
    await nftLogic.deployed();

    const ConfiguratorLogic = await hre.ethers.getContractFactory("ConfiguratorLogic");
    configuratorLogic = await ConfiguratorLogic.deploy();
    await configuratorLogic.deployed();
    
 

    console.log("ValidationLogic deployed to:", validationLogic.address);
    console.log("SupplyLogic deployed to:", supplyLogic.address);
    console.log("BorrowLogic deployed to:", borrowLogic.address);
    console.log("LiquidateLogic deployed to:", liquidateLogic.address);
    console.log("ReserveLogic deployed to:", reserveLogic.address);
    console.log("NftLogic deployed to:", nftLogic.address);
    console.log("ConfiguratorLogic deployed to:", configuratorLogic.address);


    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        const jsonData = loadJsonFile(path);
        jsonData.validationLogicAddress = validationLogic.address;
        jsonData.supplyLogicAddress = supplyLogic.address;
        jsonData.borrowLogicAddress = borrowLogic.address;
        jsonData.liquidateLogicAddress = liquidateLogic.address;
        jsonData.reserveLogicAddress = reserveLogic.address;
        jsonData.nftLogicAddress = nftLogic.address;
        jsonData.configuratorLogicAddress = configuratorLogic.address;

        saveJsonFile(path, jsonData);
    }
});



task("deploy-main-imple", "Deploy the main contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");
    await lendPoolAddressesProvider.deployed();

    const LendPool = await hre.ethers.getContractFactory("LendPool", {
      libraries: {
        SupplyLogic: supplyLogic.address,
        BorrowLogic: borrowLogic.address,
        LiquidateLogic: liquidateLogic.address,
        ReserveLogic: reserveLogic.address,
        NftLogic: nftLogic.address
      },
    });
    lendPool = await LendPool.deploy();
    await lendPool.deployed();
    

    const LendPoolLoan = await hre.ethers.getContractFactory("LendPoolLoan");
    lendPoolLoan = await LendPoolLoan.deploy();
    await lendPoolLoan.deployed();


    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: configuratorLogic.address,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.deploy();
    await lendPoolConfigurator.deployed();
    
    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.lendPoolAddressesProviderAddress = lendPoolAddressesProvider.address;
        jsonData.lendPoolAddress = lendPool.address;
        jsonData.lendPoolLoanAddress = lendPoolLoan.address;
        jsonData.lendPoolConfiguratorAddress = lendPoolConfigurator.address;
        saveJsonFile(path, jsonData);
    }
});



task("deploy-sub-imple", "Deploy the main contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);


    
    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file

        saveJsonFile(path, jsonData);
    }
});


