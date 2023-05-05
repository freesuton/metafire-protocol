import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
require('dotenv').config();
const fs = require('fs');
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate, DebtToken, BurnLockMToken} from "../../typechain-types/contracts/protocol"
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../../typechain-types/contracts/libraries/logic"

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


