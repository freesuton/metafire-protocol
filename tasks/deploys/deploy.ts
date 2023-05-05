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

task("deploy-logic", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {
    console.log("Start to deploy");


    const [owner, addr1] = await hre.ethers.getSigners();

    // Deploy and init needed contracts
    const ValidationLogic = await hre.ethers.getContractFactory("ValidationLogic");
    validationLogic = await ValidationLogic.deploy();
    await validationLogic.deployed();

    const SupplyLogic = await hre.ethers.getContractFactory("SupplyLogic");
    supplyLogic = await SupplyLogic.deploy();
    await supplyLogic.deployed();

    const BorrowLogic = await hre.ethers.getContractFactory("BorrowLogic");
    borrowLogic = await BorrowLogic.deploy();
    await borrowLogic.deployed();

    const LiquidateLogic = await hre.ethers.getContractFactory("LiquidateLogic");
    liquidateLogic = await LiquidateLogic.deploy();
    await liquidateLogic.deployed();

    const ReserveLogic = await hre.ethers.getContractFactory("ReserveLogic");
    reserveLogic = await ReserveLogic.deploy();
    await reserveLogic.deployed();

    const NFTLogic = await hre.ethers.getContractFactory("NFTLogic");
    nftLogic = await NFTLogic.deploy();
    await nftLogic.deployed();

    const ConfiguratorLogic = await hre.ethers.getContractFactory("ConfiguratorLogic");
    configuratorLogic = await ConfiguratorLogic.deploy();
    await configuratorLogic.deployed();
    

    if(taskArgs.update){
        console.log("Start to update addresses");
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


