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

    
    const SupplyLogic = await hre.ethers.getContractFactory("SupplyLogic", {libraries: {ValidationLogic: "0x0Fb2648097c80022938440767457a54937f5aef4" }});
    supplyLogic = await SupplyLogic.deploy();
    await supplyLogic.deployed();

    const BurnLockMTokenImpl = await hre.ethers.getContractFactory("BurnLockMToken");
    burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();
    await burnLockMTokenImpl.deployed();
    

    console.log("SupplyLogicV2 deployed to:", supplyLogic.address);
    console.log("BurnLockMTokenImplV2 deployed to:", burnLockMTokenImpl.address);



    // if(taskArgs.update){
    //     console.log("Start to update addresses");
    //     // load the json file
    //     jsonData.supplyLogicV2Address = supplyLogic.address;
    //     jsonData.burnLockMTokenImplV2Address = burnLockMTokenImpl.address;

    //     saveJsonFile(path, jsonData);
    // }
});

task("deploy-lendpoolv2", "Deploy lendPool contract v2")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const LendPool = await hre.ethers.getContractFactory("LendPool", {
        libraries: {
          SupplyLogic: "0x07D88814c0ea8E6Ec476aCD1e6Fae5c245AAe151",
          BorrowLogic: "0xdF840D5De27502368301553c465a422cc5C26160",
          LiquidateLogic: "0x56eA8b7CBF7634Ae036Bd26ad37FeEDE5fB573Ad",
          ReserveLogic: "0xde6d9B797BE9fB5261C1A4dca953f4C20B322144",
          NftLogic: "0x8e0A0B008046C1862cb7D43103e41817Ed67809E"
        },
      });
    lendPool = await LendPool.deploy();
    await lendPool.deployed();

    console.log("LendPoolV2 deployed to:", lendPool.address);

    // if(taskArgs.update){
    //     console.log("Start to update addresses");
    //     // load the json file
    //     jsonData.lendPoolV2Address = lendPool.address;
    //     
    //     saveJsonFile(path, jsonData);
    // }

});

task("update-to-lendpoolv2", " Update implementation contract for a proxy")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    // const LendPool = await hre.ethers.getContractFactory("LendPool", {
    //     libraries: {
    //       SupplyLogic: "0x07D88814c0ea8E6Ec476aCD1e6Fae5c245AAe151",
    //       BorrowLogic: "0xdF840D5De27502368301553c465a422cc5C26160",
    //       LiquidateLogic: "0x56eA8b7CBF7634Ae036Bd26ad37FeEDE5fB573Ad",
    //       ReserveLogic: "0xde6d9B797BE9fB5261C1A4dca953f4C20B322144",
    //       NftLogic: "0x8e0A0B008046C1862cb7D43103e41817Ed67809E"
    //     },
    //   });
  
    // const lendPool = LendPool.attach("0xbA523FF978B42852bd326725FA961164d6686B3C");

    const MetaFireProxyAdmin = await hre.ethers.getContractFactory("MetaFireProxyAdmin");
    const metaFireProxyAdmin = MetaFireProxyAdmin.attach("0x310Edb1c648c3188B2d432639573862eB201dE38");
    const tx = await metaFireProxyAdmin.upgrade("0x4E014f3CcBE21Ac578Bf7Cf41183eCCA4385a1c7", "0xbA523FF978B42852bd326725FA961164d6686B3C");
    console.log(tx);
});

task("deploy-gatewayv2", "Deploy WETH Gateway")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner, addr1] = await hre.ethers.getSigners();


    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    // const wETHGateway = await WETHGateway.deploy();
    // await wETHGateway.deployed();

    // console.log("WETHGateway deployed to",wETHGateway.address)

    const wETHGateway = WETHGateway.attach("0xdF5Fa34B5eC5C11c689C5C3Ff46Ea13DF04CE745");

    // await wETHGateway.initialize("0xD1cf1d194DFca186CF2dF6D8c56253901811a17e", "0xaF4Cc8E4B6b079426E9aCc4e2958E8e1eAfAdBD3");

    await wETHGateway.approveNFTTransfer("0x889fbf30d42602cF8086fd54874F5040deF086BE", true);

    // if(taskArgs.update){
    //     const path = './tasks/deploys/mainnetContractAddresses.json';
    //     console.log("Start to update addresses");
    //     // // load the json file
    //     jsonData.wETHGatewayAddress = wETHGateway.address;

    //     saveJsonFile(path, jsonData);
    // }
});




task("update-to-mtokenv2", "Update new mToken implementation and update the logic")
  // .addParam("address", "The NFT address")
  .setAction(async ( {} , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");


    const [owner] = await hre.ethers.getSigners();

    // const BurnLockMTokenImpl = await hre.ethers.getContractFactory("BurnLockMToken");
    // burnLockMTokenImpl = BurnLockMTokenImpl.attach("0xC8C7CE123c3e7bDdD6F8dD4Ea814aBeb227acAeb");

    // load the configurator
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
        libraries: {
          ConfiguratorLogic: "0xb4fEeDf83cD7d06d5320C34Dbb9F765D3C63D391",
        },
      });
    lendPoolConfigurator = LendPoolConfigurator.attach("0x2c3c6C68C3D2816CaA0d0A3690EEc878B8dB8b3B");


    const UpdateMTokenInput = {
      asset: "0xaF4Cc8E4B6b079426E9aCc4e2958E8e1eAfAdBD3",
      implementation:  "0xC8C7CE123c3e7bDdD6F8dD4Ea814aBeb227acAeb",
      encodedCallData: "0x"
    }

    const tx = await lendPoolConfigurator.updateMToken([UpdateMTokenInput]);
    console.log(tx);
});






