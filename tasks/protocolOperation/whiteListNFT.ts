import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import {nftList} from './nftList'
// import { ethers } from "hardhat";
require('dotenv').config();
const fs = require('fs');

function loadJsonFile(filename: string) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf-8');
}

task("whitelist", " add nft asset to the whitelist")
  .addParam("nftaddress", "The address of the nft asset")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const nftAssets = [taskArgs.nftaddress];

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    const lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    // console.log("Start to whitelist nft"+ taskArgs.nftaddress);
    const BNFTRegistry = await hre.ethers.getContractFactory("BNFTRegistry");
    const bNFTRegistry = BNFTRegistry.attach(jsonData.bNFTRegistryProxyAddress);

    // const tx = await bNFTRegistry.createBNFT(taskArgs.nftaddress);
    // console.log(tx);
    // init NFT
    const initNftInput: any = [[taskArgs.nftaddress]];
    await lendPoolConfigurator.batchInitNft(initNftInput);

    // // 1% -> 100     address, ltv, liquidationThreshold, liquidationBonus(auction), liquidatingBuyBonus
    await lendPoolConfigurator.configureNftAsCollateral(nftAssets, 6000, 8000, 1000, 500);

    // //set max limit
    await lendPoolConfigurator.setNftMaxSupplyAndTokenId(nftAssets,100000,100000);

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

    // give approval
    await wETHGateway.approveNFTTransfer(taskArgs.nftaddress, true);
});

task("register-nft", " register nft asset to the registry")
  .addParam("nftaddress", "The address of the nft asset")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const nftAssets = [taskArgs.nftaddress];

    const BNFTRegistry = await hre.ethers.getContractFactory("BNFTRegistry");
    const bNFTRegistry = BNFTRegistry.attach(jsonData.bNFTRegistryProxyAddress);

    const tx = await bNFTRegistry.createBNFT(taskArgs.nftaddress);
    console.log(tx);
});

task("init-registered-nft", "init registered nft asset to the registry")
  .addParam("nftaddress", "The address of the nft asset")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const nftAssets = [taskArgs.nftaddress];

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    const lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);
    // init NFT
    const initNftInput: any = [[taskArgs.nftaddress]];
    await lendPoolConfigurator.batchInitNft(initNftInput);
    // // 1% -> 100     address, ltv, liquidationThreshold, liquidationBonus(auction), liquidatingBuyBonus
    await lendPoolConfigurator.configureNftAsCollateral(nftAssets, 6000, 8000, 1000, 500);

    // //set (asset, maxSupply, maxTokenId)
    await lendPoolConfigurator.setNftMaxSupplyAndTokenId(nftAssets,100000,100000);

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayV2Address);

    // give approval
    await wETHGateway.approveNFTTransfer(taskArgs.nftaddress, true);
});