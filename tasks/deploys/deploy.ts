import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
require('dotenv').config();
const fs = require('fs');

import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../../typechain-types/contracts/libraries/logic"

// Libraries
let validationLogic: any;
let supplyLogic: SupplyLogic;
let borrowLogic: BorrowLogic;
let liquidateLogic: LiquidateLogic;
let reserveLogic: ReserveLogic;
let nftLogic: any;
let configuratorLogic: ConfiguratorLogic;



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

task("deploy-l", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {
    console.log("xxxx");
    const jsonData = loadJsonFile('./tasks/deploys/contractAddresses.json');
    console.log(jsonData);
});


