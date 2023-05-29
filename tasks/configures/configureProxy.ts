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

task("init-proxy-contracts", "Init the reserve")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();


    const LendPool = await hre.ethers.getContractFactory("LendPool", {
        libraries: {
          SupplyLogic: jsonData.supplyLogicAddress,
          BorrowLogic: jsonData.borrowLogicAddress,
          LiquidateLogic: jsonData.liquidateLogicAddress,
          ReserveLogic: jsonData.reserveLogicAddress,
          NftLogic: jsonData.nftLogicAddress
        },
      });
    const  lendPool = LendPool.attach(jsonData.lendPoolAddress);
    const  aLendPoolProxy = await lendPool.attach(jsonData.lendPoolProxyAddress);

    const LendPoolLoan = await hre.ethers.getContractFactory("LendPoolLoan");
    const lendPoolLoan = LendPoolLoan.attach(jsonData.lendPoolLoanAddress);
    const aLendPoolLoanProxy = await lendPoolLoan.attach(jsonData.lendPoolLoanProxyAddress);

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
        libraries: {
          ConfiguratorLogic: jsonData.configuratorLogicAddress,
        },
      });
    const lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);
    const aLendPoolConfiguratorProxy = await lendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    const BNFTRegistry = await hre.ethers.getContractFactory("BNFTRegistry");
    const bNFTRegistry = BNFTRegistry.attach(jsonData.bNFTRegistryAddress);
    const aBNFTRegistryProxy = await bNFTRegistry.attach(jsonData.bNFTRegistryProxyAddress);


    // const MockReserveOracle = await hre.ethers.getContractFactory("MockReserveOracle");
    // const mockReserveOracle = MockReserveOracle.attach(jsonData.mockReserveOracleAddress);
    // const aMockReserveOracleProxy = await mockReserveOracle.attach(jsonData.mockReserveOracleProxyAddress);

    // const MockDIAOracle = await hre.ethers.getContractFactory("MockDIAOracle");
    // const mockDIAOracle = MockDIAOracle.attach(jsonData.mockDIAOracle);
    // const aMockDIAOracleProxy = await mockDIAOracle.attach(jsonData.mockDIAOracleProxyAddress);

    /**
     * Init contracts
     */
    console.log(jsonData.lendPoolAddressesProviderAddress);
    await aLendPoolProxy.initialize(jsonData.lendPoolAddressesProviderAddress,{gasLimit: 10000000});
    await aLendPoolLoanProxy.initialize(jsonData.lendPoolAddressesProviderAddress,{gasLimit: 10000000});
    await aLendPoolConfiguratorProxy.initialize(jsonData.lendPoolAddressesProviderAddress, {gasLimit: 10000000});

    // Init BNFT Registry
    await aBNFTRegistryProxy.initialize(jsonData.bNFTAddress,"M","M", {gasLimit: 10000000});
    // Create Proxy and init IMPL
    await aBNFTRegistryProxy.createBNFT(jsonData.mintableERC721Address, {gasLimit: 10000000});



});

task("init-oracle-getter", "Init the reserve")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");
    const CHAIN_NAME = "Ethereum-";

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();


    const NFTOracleGetter = await hre.ethers.getContractFactory("NFTOracleGetter");
    const nftOracleGetter = NFTOracleGetter.attach(jsonData.nftOracleGetterAddress);
    const aNFTOracleGetterProxy = await nftOracleGetter.attach(jsonData.nftOracleGetterProxyAddress);

    const tx = await aNFTOracleGetterProxy.initialize(CHAIN_NAME,jsonData.mockDIAOracleAddress,jsonData.lendPoolAddressesProviderAddress,{gasLimit: 10000000});
    await tx.wait();
    console.log("NFTOracleGetter initialized");
});

task("set-addresses-proxy", "Init the reserve")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");
    const CHAIN_NAME = "Ethereum-";

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    const lendPoolAddressesProvider = LendPoolAddressesProvider.attach(jsonData.lendPoolAddressesProviderAddress);

    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL"), jsonData.aLendPoolProxyAddress)
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL_CONFIGURATOR"), jsonData.lendPoolConfiguratorProxyAddress)
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("BNFT_REGISTRY"), jsonData.bNFTRegistryProxyAddress);
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL_LOAN"), jsonData.lendPoolLoanProxyAddress);
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("RESERVE_ORACLE"), jsonData.mockReserveOracleProxyAddress);
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("NFT_ORACLE"), jsonData.nftOracleGetterProxyAddress);

});

task("basic-config-proxy", "Init the reserve")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");
    const CHAIN_NAME = "Ethereum-";

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    const erc20Assets = [jsonData.wETHAddress];
    const nftAssets = [jsonData.mintableERC721Address];

    // Load the contract
  // Initialize lend pool configurator
  const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
    libraries: {
      ConfiguratorLogic: jsonData.configuratorLogicAddress,
    },
  });
  lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);

  const aLendPoolConfiguratorProxy = await lendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    await aLendPoolConfiguratorProxy.setBorrowingFlagOnReserve(erc20Assets, true);
    // set reserve interest rate address
    await aLendPoolConfiguratorProxy.setReserveInterestRateAddress(erc20Assets, jsonData.interestRateAddress);
    await aLendPoolConfiguratorProxy.setNftMaxSupplyAndTokenId(nftAssets,50,0);
    await aLendPoolConfiguratorProxy.setBorrowingFlagOnReserve(erc20Assets, true);
    await aLendPoolConfiguratorProxy.setActiveFlagOnReserve(erc20Assets, true);
    // position 64. 1% -> 100
    await aLendPoolConfiguratorProxy.setReserveFactor(erc20Assets,3000);
    await aLendPoolConfiguratorProxy.setReserveInterestRateAddress(erc20Assets,jsonData.interestRateAddress);
    // 1% -> 100     address, ltv, liquidationThreshold, liquidationBonus
    await aLendPoolConfiguratorProxy.configureNftAsCollateral(nftAssets, 5000, 5000, 500);
});

task("init-reserve-proxy", "Init the reserve")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");
    const CHAIN_NAME = "Ethereum-";

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    // Initialize lend pool configurator
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
        libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
        },
    });
    lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);

    const aLendPoolConfiguratorProxy = await lendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);
    
    // init reserve
    const initReserveInput: any = [[jsonData.burnLockMTokenImplAddress, jsonData.debtTokenImplAddress, 18, jsonData.interestRateAddress,jsonData.wETHAddress,owner.address,"WETH","MToken","MT","DebtToken","DT"]];
    await aLendPoolConfiguratorProxy.batchInitReserve(initReserveInput, {gasLimit: 5000000});

});

task("init-nft-proxy", "Init the reserve")
  .addFlag("update", "Whether to update the logic contract addresses")
  .addParam("nftAddress", "The NFT address")
  .setAction(async ( {nftAddress} , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");
    const CHAIN_NAME = "Ethereum-";

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const [owner] = await hre.ethers.getSigners();

    // Initialize lend pool configurator
    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
        libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
        },
    });
    lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorAddress);

    const aLendPoolConfiguratorProxy = await lendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    // init NFT
    const initNftInput: any = [[nftAddress]];
    await aLendPoolConfiguratorProxy.batchInitNft(initNftInput, {gasLimit: 5000000});

});





function loadJsonFile(filename: string) {
    const data = fs.readFileSync(filename, 'utf-8');
    return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
    const jsonString = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonString, 'utf-8');
}