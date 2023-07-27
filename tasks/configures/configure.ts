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

task("init-reserve", "Init the reserve")
  .addFlag("update", "Whether to update the logic contract addresses")
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

    // init reserve
    const initReserveInput: any = [[jsonData.burnLockMTokenImplAddress, jsonData.debtTokenImplAddress, 18, jsonData.interestRateAddress,jsonData.wETHAddress,owner.address,"WETH","MToken","MT","DebtToken","DT"]];
    await lendPoolConfigurator.batchInitReserve(initReserveInput);
});

task("init-nft", "Init the NFT")
  .addParam("address", "The NFT address")
  .setAction(async ( {address} , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    // Load the contract
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);

    // init NFT
    const initNftInput: any = [[address]];
    await lendPoolConfigurator.batchInitNft(initNftInput);
});

task("basic-config", "Configure the protocol")
  .setAction(async (  hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    // configuration
    
    const erc20Assets = [jsonData.wETHAddress];
    const nftAssets = [jsonData.mintableERC721Address];


    // Load the contract
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator");
    lendPoolConfigurator = await LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);

    await lendPoolConfigurator.setBorrowingFlagOnReserve(erc20Assets, true);
    // set reserve interest rate address
    await lendPoolConfigurator.setReserveInterestRateAddress(erc20Assets, jsonData.interestRateAddress);
    await lendPoolConfigurator.setNftMaxSupplyAndTokenId(nftAssets,50,0);
    await lendPoolConfigurator.setBorrowingFlagOnReserve(erc20Assets, true);
    await lendPoolConfigurator.setActiveFlagOnReserve(erc20Assets, true);
    // position 64. 1% -> 100
    await lendPoolConfigurator.setReserveFactor(erc20Assets,3000);
    await lendPoolConfigurator.setReserveInterestRateAddress(erc20Assets,jsonData.interestRateAddress);
    // 1% -> 100     address, ltv, liquidationThreshold, liquidationBonus
    await lendPoolConfigurator.configureNftAsCollateral(nftAssets, 5000, 5000, 500);
});

task("set-nft-auction", "Set NFT auction config")
  .setAction(async (taskArguments, hre) => {

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    // configuration
    const erc20Assets = [jsonData.wETHAddress];

    // Load the contract
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    // (nftaddress, hours, hours, percentage: 1% = 100)
    const tx = await lendPoolConfigurator.configureNftAsAuction(erc20Assets, 12,24, 500);
    console.log(tx);

});



task("approve-weth", "Init the NFT")
  // .addParam("address", "The NFT address")
  .setAction(async ( {} , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    // configuration
    
    const erc20Assets = [jsonData.wETHAddress];
    const nftAssets = [jsonData.mintableERC721Address];

    const WETH9Mocked = await hre.ethers.getContractFactory("WETH9Mocked");
    const wETH = await WETH9Mocked.attach(jsonData.wETHAddress);

    // console.log(reserveData);
    await wETH.mint(oneEther.mul(100));
    await wETH.approve(jsonData.lendPoolAddress,oneEther.mul(100));

});

task("deploy-update-mToken", "Deploy new mToken implementation and update the logic")
  // .addParam("address", "The NFT address")
  .setAction(async ( {} , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const BurnLockMTokenImpl = await hre.ethers.getContractFactory("BurnLockMToken");
    burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();
    await burnLockMTokenImpl.deployed();

    // load the configurator
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator");
    lendPoolConfigurator = await LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);


    const UpdateMTokenInput = {
      asset: jsonData.wETHAddress,
      implementation: burnLockMTokenImpl.address,
      encodedCallData: "0x"
    }

    const tx = await lendPoolConfigurator.updateMToken([UpdateMTokenInput]);
    console.log(tx);
});

task("update-mtoken-lock-period", "Update mToken lock period")
  .addParam("address", "The mToken address")
  .addParam("period", "Period of lock")
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
    const tx = await burnLockMToken.setLockPeriod(taskArgs.period);
    lockPeriod = await burnLockMToken.LOCK_PERIOD();
    console.log("New lock period: ", lockPeriod.toString());
    
    console.log(tx);
});

task("deposit-via-gateway", "Deploy new mToken implementation and update the logic")
  // .addParam("address", "The NFT address")
  .setAction(async ( {} , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = await WETHGateway.attach(jsonData.wETHGatewayAddress);

    const tx = await wETHGateway.depositETH(owner.address, 0, 0, {value: oneEther.div(100)});
    console.log(tx);
});

function loadJsonFile(filename: string) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf-8');
}