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
let lendPoolProxy: MetaFireUpgradeableProxy;
let lendPoolLoanProxy: MetaFireUpgradeableProxy;
let lendPoolConfiguratorProxy: MetaFireUpgradeableProxy;
let lendPoolAddressesProviderProxy: MetaFireUpgradeableProxy;
let bNFTRegistryProxy: MetaFireUpgradeableProxy;
let mockNFTOracleProxy: MetaFireUpgradeableProxy;
let mockReserveOracleProxy: MetaFireUpgradeableProxy;
let nftOracleGetterProxy: any;


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





task("deploy-updated-token-withdraw-contracts", "Deploy updated  mtoken and withdraw contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {
    console.log("Start to deploy");

    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner, addr1] = await hre.ethers.getSigners();

    
    const SupplyLogic = await hre.ethers.getContractFactory("SupplyLogic", {libraries: {ValidationLogic: jsonData.validationLogicAddress }});
    supplyLogic = await SupplyLogic.deploy();
    await supplyLogic.deployed();

    const BurnLockMTokenImpl = await hre.ethers.getContractFactory("BurnLockMToken");
    burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();
    await burnLockMTokenImpl.deployed();
    

    console.log("SupplyLogicV2 deployed to:", supplyLogic.address);
    console.log("BurnLockMTokenImplV2 deployed to:", burnLockMTokenImpl.address);



    if(taskArgs.update){
        console.log("Start to update addresses");
        // load the json file
        jsonData.supplyLogicV2Address = supplyLogic.address;
        jsonData.burnLockMTokenImplV2Address = burnLockMTokenImpl.address;

        saveJsonFile(path, jsonData);
    }
});












