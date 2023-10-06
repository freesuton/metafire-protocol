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
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const WETH9Mocked = await hre.ethers.getContractFactory("WETH9Mocked");
    const wETH = WETH9Mocked.attach(jsonData.wETHAddress);

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

    // await wETH.approve(wETHGateway.address,oneEther.mul(100));
    await wETHGateway.depositETH(owner.address,0,0,{value:oneEther.div(10)});

});

task("mint-nft", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const [owner] = await hre.ethers.getSigners();

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    const mintableERC721 = MintableERC721.attach(jsonData.mintableERC721Address);

    await mintableERC721.mint(7,{gasLimit:2000000});
    await mintableERC721.approve(jsonData.lendPoolProxyAddress, 7, {gasLimit:2000000});

});

task("borrow-nft-via-gateway", " Borrow fund via gateway")
  .addParam("nftaddress", "The address of the nft asset")
  .setAction(async ( taskArgs , hre) => {

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const [owner] = await hre.ethers.getSigners();

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);


    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    const mintableERC721 = MintableERC721.attach(taskArgs.nftaddress);

    // await mintableERC721.mint(5,{gasLimit:2000000});
    // await mintableERC721.approve(jsonData.wETHGatewayAddress, 5, {gasLimit:1000000});

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

    // const DebtToken = await hre.ethers.getContractFactory("DebtToken");
    // const debtToken = DebtToken.attach(jsonData.debtTokenAddress);

    // await debtToken.approveDelegation(wETHGateway.address,oneEther.mul(100));
    // await wETHGateway.approveNFTTransfer(taskArgs.nftaddress, true);
    const tx = await wETHGateway.borrowETH(oneEther.div(1000),taskArgs.nftaddress,1,owner.address,0,{gasLimit:500000});
    console.log(tx);

});


task("withdraw-via-gateway", " Borrow fund via gateway")
  .setAction(async ( taskArgs , hre) => {

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const [owner] = await hre.ethers.getSigners();

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);



    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

    // const DebtToken = await hre.ethers.getContractFactory("DebtToken");
    // const debtToken = DebtToken.attach(jsonData.debtTokenAddress);

    // await debtToken.approveDelegation(wETHGateway.address,oneEther.mul(100));
    // await wETHGateway.approveNFTTransfer(taskArgs.nftaddress, true);
    const MToken = await hre.ethers.getContractFactory("BurnLockMToken");
    const mToken = MToken.attach("0x9bd84f3310408A90cB04385ad8A39F4222CD1475");
    await mToken.approve(wETHGateway.address,oneEther.mul(100));
    const tx = await wETHGateway.withdrawETH(oneEther.div(1000),owner.address,0,{gasLimit:1000000});
    console.log(tx);

});



// Update contract
task("update-library", " Update  library contract for a proxy")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const BorrowLogic = await hre.ethers.getContractFactory("BorrowLogic", {libraries: {ValidationLogic: jsonData.validationLogicAddress}});
    const borrowLogic = await BorrowLogic.deploy();
    await borrowLogic.deployed();
  
    console.log("BorrowLogic deployed to:", borrowLogic.address);


    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // // load the json file
        jsonData.borrowLogicAddress = borrowLogic.address;
        saveJsonFile(path, jsonData);
    }
});

task("update-impl", " Update implementation contract for a proxy")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const LendPool = await hre.ethers.getContractFactory("LendPool", {
        libraries: {
          SupplyLogic: jsonData.supplyLogicAddress,
          BorrowLogic: jsonData.borrowLogicAddress,
          LiquidateLogic: jsonData.liquidateLogicAddress,
          ReserveLogic: jsonData.reserveLogicAddress,
          NftLogic: jsonData.nftLogicAddress
        },
      });
  
    const lendPool = await LendPool.deploy();
    await lendPool.deployed();

    const MetaFireProxyAdmin = await hre.ethers.getContractFactory("MetaFireProxyAdmin");
    const metaFireProxyAdmin = MetaFireProxyAdmin.attach(jsonData.metaFireProxyAdminAddress);
    const tx = await metaFireProxyAdmin.upgrade(jsonData.lendPoolProxyAddress,lendPool.address);
    console.log(tx);


    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // // load the json file
        jsonData.lendPoolAddressII = lendPool.address;
        saveJsonFile(path, jsonData);
    }
});



task("whitelist-nft", " add nft asset to the whitelist")
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
    // await lendPoolConfigurator.batchInitNft(initNftInput);

    // // 1% -> 100     address, ltv, liquidationThreshold, liquidationBonus(auction), liquidatingBuyBonus
    // await lendPoolConfigurator.configureNftAsCollateral(nftAssets, 6000, 8000, 1000, 500);

    // //set max limit
    // await lendPoolConfigurator.setNftMaxSupplyAndTokenId(nftAssets,100000,100000);

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

    // give approval
    await wETHGateway.approveNFTTransfer(taskArgs.nftaddress, true);
});

task("repay-via-gateway", "Repay loan via gateway")
  .addParam("nftaddress", "The address of the nft asset")
  .addParam("tokenid", "The token id of the nft asset")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const nftAssets = [taskArgs.nftaddress];

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

  

    const tx = await wETHGateway.repayETH(taskArgs.nftaddress, taskArgs.tokenid,oneEther.div(1000),{value:oneEther.div(1000),gasLimit: 2000000});
    console.log(tx);
});

task("auction-via-gateway", "Repay loan via gateway")
  .addParam("nftaddress", "The address of the nft asset")
  .addParam("tokenid", "The token id of the nft asset")
  .setAction(async ( taskArgs , hre) => {

    const [owner] = await hre.ethers.getSigners();
    
    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const nftAssets = [taskArgs.nftaddress];

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = WETHGateway.attach(jsonData.wETHGatewayAddress);

    // const tx = await wETHGateway.repayETH(taskArgs.nftaddress, taskArgs.tokenid,oneEther.div(1000),{value:oneEther.div(1000),gasLimit: 2000000});
    const tx = await wETHGateway.auctionETH(taskArgs.nftaddress, taskArgs.tokenid,owner.address, {value:oneEther.div(10),gasLimit: 2000000});
    console.log(tx);
});

