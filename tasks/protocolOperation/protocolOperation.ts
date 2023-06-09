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


task("deposit-via-gateway", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const [owner] = await hre.ethers.getSigners();

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const WETH9Mocked = await hre.ethers.getContractFactory("WETH9Mocked");
    const wETH = WETH9Mocked.attach(jsonData.wETHAddress);

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

    // await wETH.approve(wETHGateway.address,oneEther.mul(100));
    await wETHGateway.depositETH(owner.address,0,0,{value:oneEther.mul(1)});

});

task("mint-nft", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const [owner] = await hre.ethers.getSigners();

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    const mintableERC721 = MintableERC721.attach(jsonData.mintableERC721Address);

    await mintableERC721.mint(3);
    await mintableERC721.approve(jsonData.lendPoolProxyAddress, 3);

});

task("borrow-nft-via-gateway", " Borrow fund via gateway")
  .setAction(async ( taskArgs , hre) => {

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const [owner] = await hre.ethers.getSigners();

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    // const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
    //     libraries: {
    //       ConfiguratorLogic: jsonData.configuratorLogicAddress,
    //     },
    //   });
    // const lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    // const nftAssets = [jsonData.mintableERC721Address];
    // await lendPoolConfigurator.setNftMaxSupplyAndTokenId(nftAssets,500,500);

    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    const mintableERC721 = MintableERC721.attach(jsonData.mintableERC721Address);

    await mintableERC721.approve(jsonData.wETHGatewayAddress, 3);

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

    const tx = await wETHGateway.borrowETH(oneEther.div(200),mintableERC721.address,3,owner.address,0,{gasLimit:2000000});
    console.log(tx);

});
