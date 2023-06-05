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

task("migrate-nft-oracle", " migrate from dia oracle to mock oracle")
  // .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    // Load the contract
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);

    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    const lendPoolAddressesProvider = LendPoolAddressesProvider.attach(jsonData.lendPoolAddressesProviderAddress);

    // await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("NFT_ORACLE"), jsonData.mockNFTOracleAddress);

    const NFTOracle = await hre.ethers.getContractFactory("NFTOracle");
    const mockNFTOracle = await NFTOracle.attach(jsonData.nftOracleAddress);

    // await mockNFTOracle.initialize(owner.address,oneEther.div(10).mul(2),oneEther.div(10),30,10,600);

    //set nft oracle price to 2 ethers
    // const nftAssets = [mintableERC721.address];
    // await mockNFTOracle.setAssets(nftAssets);
    // await mockNFTOracle.setAssetData(mintableERC721.address, oneEther.mul(4));

});

task("set-mock-oracle-price", " set mock nft price")
  // .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    // Load the contract
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);


    // await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("NFT_ORACLE"), jsonData.mockNFTOracleAddress);

    const NFTOracle = await hre.ethers.getContractFactory("NFTOracle");
    const mockNFTOracle = await NFTOracle.attach(jsonData.mockNFTOracleAddress);

    // await mockNFTOracle.initialize(owner.address,oneEther.div(10).mul(2),oneEther.div(10),30,10,600);

    //set nft oracle price to 2 ethers
    const nftAssets = [jsonData.mintableERC721Address];
    // await mockNFTOracle.setAssets(nftAssets);
    await mockNFTOracle.setAssetData(jsonData.mintableERC721Address, oneEther.mul(4));

});

task("get-mock-oracle-price", " get mock nft price")
  // .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const NFTOracle = await hre.ethers.getContractFactory("NFTOracle");
    const mockNFTOracle = await NFTOracle.attach(jsonData.mockNFTOracleAddress);

    // await mockNFTOracle.setAssets(nftAssets);
    const price = await mockNFTOracle.getAssetPrice(jsonData.mintableERC721Address);
    console.log("price: ", price.toString());

});

task("get-reserve-price", " get reserve price")
  // .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const ReserveOracle = await hre.ethers.getContractFactory("ReserveOracle");
    const mockReserveOracle = await ReserveOracle.attach(jsonData.mockReserveOracleProxyAddress);
    const price = await mockReserveOracle.getAssetPrice(jsonData.wETHAddress);
    console.log("price: ", price.toString());

});

function loadJsonFile(filename: string) {
  const data = fs.readFileSync(filename, 'utf-8');
  return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonString, 'utf-8');
}