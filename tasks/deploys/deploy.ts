import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
// import { ethers } from "hardhat";
require('dotenv').config();
const fs = require('fs');
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate, DebtToken, BurnLockMToken} from "../../typechain-types/contracts/protocol"
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../../typechain-types/contracts/libraries/logic"
import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721} from "../typechain-types/contracts/mock";


const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
const ONE_DAY = 3600 * 24;
const ONE_MONTH = 3600 * 24 * 30;
const ONE_GWEI = 1_000_000_000;

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
let mockReserveOracle: MockReserveOracle;




function loadJsonFile(filename: string) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf-8');
}


task("deploy-logic", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {
    console.log("Start to deploy");


    const [owner, addr1] = await hre.ethers.getSigners();

    // Deploy and init needed contracts
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

    console.log("ValidationLogic deployed to:", validationLogic.address);
});



task("deploy-main", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);


    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");

    const LendPool = await hre.ethers.getContractFactory("LendPool", {
      libraries: {
        SupplyLogic: jsonData.supplyLogicAddress,
        BorrowLogic: jsonData.borrowLogicAddress,
        LiquidateLogic: jsonData.liquidateLogicAddress,
        ReserveLogic: jsonData.reserveLogicAddress,
        NftLogic: jsonData.nftLogicAddress,
      },
    });
    lendPool = await LendPool.deploy();
    await lendPool.initialize(lendPoolAddressesProvider.address);

    const LendPoolLoan = await hre.ethers.getContractFactory("LendPoolLoan");
    lendPoolLoan = await LendPoolLoan.deploy();
    await lendPoolLoan.initialize(lendPoolAddressesProvider.address);

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.deploy();
    await lendPoolConfigurator.initialize(lendPoolAddressesProvider.address);

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


task("deploy-interest", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);


    const InterestRate = await hre.ethers.getContractFactory("InterestRate");
    // U: 65%, BR:10%, S1: 8%, d2: 100%
    // distributeCoefficients_： 2:3:4:5
    const distributeCoefficients= [ray,ray.mul(2),ray.mul(3),ray.mul(4)];
    interestRate = await InterestRate.deploy(jsonData.lendPoolAddressesProviderAddress,ray.div(100).mul(65),ray.div(10),ray.div(100).mul(8),ray, distributeCoefficients);
    await interestRate.deployed();

    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.interestRateAddress = interestRate.address;
        saveJsonFile(path, jsonData);
    }
});

task("deploy-sub", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);


    const WETH9Mocked = await hre.ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();
    await wETH.deployed();

    const DebtTokenImpl = await hre.ethers.getContractFactory("DebtToken");
    debtTokenImpl = await DebtTokenImpl.deploy();
    await debtTokenImpl.deployed();

    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");
    await mintableERC721.deployed();

    const BurnLockMTokenImpl = await hre.ethers.getContractFactory("BurnLockMToken");
    burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();
    await burnLockMTokenImpl.deployed();

    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.wETHAddress = wETH.address;
        jsonData.debtTokenImplAddress = debtTokenImpl.address;
        jsonData.mintableERC721Address = mintableERC721.address;
        jsonData.burnLockMTokenImplAddress = burnLockMTokenImpl.address;
        saveJsonFile(path, jsonData);
    }
});


task("deploy-oracle", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    const [owner, addr1] = await hre.ethers.getSigners();

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    // Oracle
    const MockNFTOracle = await hre.ethers.getContractFactory("MockNFTOracle");
    mockNFTOracle = await MockNFTOracle.deploy();
    await mockNFTOracle.deployed();

    await mockNFTOracle.initialize(owner.address,oneEther.div(10).mul(2),oneEther.div(10),30,10,600);
    const MockReserveOracle = await hre.ethers.getContractFactory("MockReserveOracle");
    mockReserveOracle = await MockReserveOracle.deploy();
    await mockReserveOracle.deployed();
    await mockReserveOracle.initialize(wETH.address);


    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.mockNFTOracleAddress = mockNFTOracle.address;
        jsonData.mockReserveOracleAddress = mockReserveOracle.address;
        saveJsonFile(path, jsonData);
    }
});