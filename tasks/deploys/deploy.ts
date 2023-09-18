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





task("deploy-libraries", "Deploy the logic library contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {
    console.log("Start to deploy");


    const [owner, addr1] = await hre.ethers.getSigners();

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
    
 

    console.log("ValidationLogic deployed to:", validationLogic.address);
    console.log("SupplyLogic deployed to:", supplyLogic.address);
    console.log("BorrowLogic deployed to:", borrowLogic.address);
    console.log("LiquidateLogic deployed to:", liquidateLogic.address);
    console.log("ReserveLogic deployed to:", reserveLogic.address);
    console.log("NftLogic deployed to:", nftLogic.address);
    console.log("ConfiguratorLogic deployed to:", configuratorLogic.address);


    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
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
});



task("deploy-main-imple", "Deploy the main contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");
    await lendPoolAddressesProvider.deployed();

    const LendPool = await hre.ethers.getContractFactory("LendPool", {
      libraries: {
        SupplyLogic: jsonData.supplyLogicAddress,
        BorrowLogic: jsonData.borrowLogicAddress,
        LiquidateLogic: jsonData.liquidateLogicAddress,
        ReserveLogic: jsonData.reserveLogicAddress,
        NftLogic: jsonData.nftLogicAddress
      },
    });
    lendPool = await LendPool.deploy();
    await lendPool.deployed();
    

    const LendPoolLoan = await hre.ethers.getContractFactory("LendPoolLoan");
    lendPoolLoan = await LendPoolLoan.deploy();
    await lendPoolLoan.deployed();


    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.deploy();
    await lendPoolConfigurator.deployed();

    console.log("LendPoolAddressesProvider deployed to:", lendPoolAddressesProvider.address);
    console.log("LendPool deployed to:", lendPool.address);
    console.log("LendPoolLoan deployed to:", lendPoolLoan.address);
    console.log("LendPoolConfigurator deployed to:", lendPoolConfigurator.address);

    
    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.lendPoolAddressesProviderAddress = lendPoolAddressesProvider.address;
        jsonData.lendPoolAddress = lendPool.address;
        jsonData.lendPoolLoanAddress = lendPoolLoan.address;
        jsonData.lendPoolConfiguratorAddress = lendPoolConfigurator.address;
        saveJsonFile(path, jsonData);
    }
});



task("deploy-sub-imple", "Deploy the main contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    // sub imple contracts
    const DebtTokenImpl = await hre.ethers.getContractFactory("DebtToken");
    debtTokenImpl = await DebtTokenImpl.deploy();
    await debtTokenImpl.deployed();

    const BurnLockMTokenImpl = await hre.ethers.getContractFactory("BurnLockMToken");
    burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();
    await burnLockMTokenImpl.deployed();

    const BNFT = await hre.ethers.getContractFactory("BNFT");
    bNFT = await BNFT.deploy();
    await bNFT.deployed();

    const BNFTRegistry = await hre.ethers.getContractFactory("BNFTRegistry");
    bNFTRegistry = await BNFTRegistry.deploy();
    await bNFTRegistry.deployed();

    console.log("DebtTokenImpl deployed to:", debtTokenImpl.address);
    console.log("BurnLockMTokenImpl deployed to:", burnLockMTokenImpl.address);
    console.log("BNFT deployed to:", bNFT.address);
    console.log("BNFTRegistry deployed to:", bNFTRegistry.address);
    
    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // load the json file

        jsonData.debtTokenImplAddress = debtTokenImpl.address;
        jsonData.burnLockMTokenImplAddress = burnLockMTokenImpl.address;
        jsonData.bNFTAddress = bNFT.address;
        jsonData.bNFTRegistryAddress = bNFTRegistry.address;
        saveJsonFile(path, jsonData);
    }
});


task("deploy-oracle", "Deploy the main contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const MockReserveOracle = await hre.ethers.getContractFactory("MockReserveOracle");
    mockReserveOracle = await MockReserveOracle.deploy();
    await mockReserveOracle.deployed();

    const MockDIAOracle = await hre.ethers.getContractFactory("MockDIAOracle");
    mockDIAOracle = await MockDIAOracle.deploy();
    await mockDIAOracle.deployed();

    const AddressChecksumUtils = await hre.ethers.getContractFactory("AddressChecksumUtils");
    const addressCheckSumUtils = await AddressChecksumUtils.deploy();
    await addressCheckSumUtils.deployed();

    const NFTOracleGetter = await hre.ethers.getContractFactory("NFTOracleGetter",{libraries: {AddressChecksumUtils: addressCheckSumUtils.address}});
    nftOracleGetter = await NFTOracleGetter.deploy();
    nftOracleGetter.deployed();
    
    console.log("MockReserveOracle deployed to:", mockReserveOracle.address);
    console.log("MockDIAOracle deployed to:", mockDIAOracle.address);
    console.log("AddressChecksumUtils deployed to:", addressCheckSumUtils.address);

    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.mockReserveOracleAddress = mockReserveOracle.address;
        jsonData.mockDIAOracleAddress = mockDIAOracle.address;
        jsonData.addressCheckSumUtilsAddress = addressCheckSumUtils.address;
        jsonData.nftOracleGetterAddress = nftOracleGetter.address;

        saveJsonFile(path, jsonData);
    }
});

task("deploy-proxy-contracts", "Deploy all proxy contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const MetaFireProxyAdmin = await hre.ethers.getContractFactory("MetaFireProxyAdmin");
    metaFireProxyAdmin = await MetaFireProxyAdmin.deploy();
    await metaFireProxyAdmin.deployed();

    const MetaFireUpgradeableProxy = await hre.ethers.getContractFactory("MetaFireUpgradeableProxy");

    lendPoolProxy = await MetaFireUpgradeableProxy.deploy(jsonData.lendPoolAddress, metaFireProxyAdmin.address, "0x");
    await lendPoolProxy.deployed();
    lendPoolLoanProxy = await MetaFireUpgradeableProxy.deploy(jsonData.lendPoolLoanAddress,metaFireProxyAdmin.address,"0x");
    await lendPoolLoanProxy.deployed();
    lendPoolConfiguratorProxy = await MetaFireUpgradeableProxy.deploy(jsonData.lendPoolConfiguratorAddress,metaFireProxyAdmin.address,"0x");
    await lendPoolConfiguratorProxy.deployed();

    bNFTRegistryProxy = await MetaFireUpgradeableProxy.deploy(jsonData.bNFTRegistryAddress,metaFireProxyAdmin.address,"0x");
    await bNFTRegistryProxy.deployed();

    mockReserveOracleProxy = await MetaFireUpgradeableProxy.deploy(jsonData.mockReserveOracleAddress,metaFireProxyAdmin.address,"0x");
    await mockReserveOracleProxy.deployed();

    nftOracleGetterProxy = await MetaFireUpgradeableProxy.deploy(jsonData.nftOracleGetterAddress,metaFireProxyAdmin.address,"0x");
    await nftOracleGetterProxy.deployed();

    console.log("MetaFireProxyAdmin deployed to:", metaFireProxyAdmin.address);
    console.log("LendPoolProxy deployed to:", lendPoolProxy.address);
    console.log("LendPoolLoanProxy deployed to:", lendPoolLoanProxy.address);
    console.log("LendPoolConfiguratorProxy deployed to:", lendPoolConfiguratorProxy.address);
    console.log("BNFTRegistryProxy deployed to:", bNFTRegistryProxy.address);
    console.log("MockReserveOracleProxy deployed to:", mockReserveOracleProxy.address);
    console.log("NFTOracleGetterProxy deployed to:", nftOracleGetterProxy.address);

    
    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.metaFireProxyAdminAddress = metaFireProxyAdmin.address;
        jsonData.lendPoolProxyAddress = lendPoolProxy.address;
        jsonData.lendPoolLoanProxyAddress = lendPoolLoanProxy.address;
        jsonData.lendPoolConfiguratorProxyAddress = lendPoolConfiguratorProxy.address;
        jsonData.bNFTRegistryProxyAddress = bNFTRegistryProxy.address;
        jsonData.mockReserveOracleProxyAddress = mockReserveOracleProxy.address;
        jsonData.nftOracleGetterProxyAddress = nftOracleGetterProxy.address;

        saveJsonFile(path, jsonData);
    }
});

task("deploy-sub-contrcts", "Deploy the sub contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const InterestRate = await hre.ethers.getContractFactory("InterestRate");
    // U: 80%, BR:15%, S1: 8%, s2: 100%
    // distributeCoefficients_： 10:12:14:16
    const distributeCoefficients= [ray.mul(10),ray.mul(12),ray.mul(14),ray.mul(16)];
    interestRate = await InterestRate.deploy(jsonData.lendPoolAddressesProviderAddress,ray.div(100).mul(80),ray.div(100).mul(20),ray.div(100).mul(8),ray, distributeCoefficients);
    

    const WETH9Mocked = await hre.ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();

    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");


    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.interestRateAddress = interestRate.address;
        jsonData.wETHAddress = wETH.address;
        jsonData.mintableERC721Address = mintableERC721.address;

        saveJsonFile(path, jsonData);
    }
});


task("init-proxy-contracts", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);


    // all thoese objects are proxy contract
    const LendPool = await hre.ethers.getContractFactory("LendPool", {
      libraries: {
        SupplyLogic: jsonData.supplyLogicAddress,
        BorrowLogic: jsonData.borrowLogicAddress,
        LiquidateLogic: jsonData.liquidateLogicAddress,
        ReserveLogic: jsonData.reserveLogicAddress,
        NftLogic: jsonData.nftLogicAddress
      },
    });
    const lendPool = LendPool.attach(jsonData.lendPoolProxyAddress);

    const LendPoolLoan = await hre.ethers.getContractFactory("LendPoolLoan");
    const lendPoolLoan = LendPoolLoan.attach(jsonData.lendPoolLoanProxyAddress);

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    const lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    const BNFTRegistry = await hre.ethers.getContractFactory("BNFTRegistry");
    const bNFTRegistry = BNFTRegistry.attach(jsonData.bNFTRegistryProxyAddress);

    const MockReserveOracle = await hre.ethers.getContractFactory("MockReserveOracle");
    const mockReserveOracle = MockReserveOracle.attach(jsonData.mockReserveOracleProxyAddress);

    const NFTOracleGetter = await hre.ethers.getContractFactory("NFTOracleGetter",{libraries: {AddressChecksumUtils: jsonData.addressCheckSumUtilsAddress}});
    const nftOracleGetter = NFTOracleGetter.attach(jsonData.nftOracleGetterProxyAddress);

    // await lendPool.initialize(jsonData.lendPoolAddressesProviderAddress, {gasLimit: 10000000});
    // await lendPoolLoan.initialize(jsonData.lendPoolAddressesProviderAddress, {gasLimit: 500000});
    // await lendPoolConfigurator.initialize(jsonData.lendPoolAddressesProviderAddress, {gasLimit: 200000});
    // await bNFTRegistry.initialize(jsonData.bNFTAddress,"M","M", {gasLimit: 200000});
    await bNFTRegistry.createBNFT(jsonData.mintableERC721Address, {gasLimit: 1000000});
    // await mockReserveOracle.initialize(jsonData.wETHAddress, {gasLimit: 200000});
    // await nftOracleGetter.initialize("Ethereum-", jsonData.mockDIAOracleAddress, jsonData.lendPoolAddressesProviderAddress, {gasLimit: 200000});

});

task("set-addresses", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    const lendPoolAddressesProvider = LendPoolAddressesProvider.attach(jsonData.lendPoolAddressesProviderAddress);

    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL"), jsonData.lendPoolProxyAddress)
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL_CONFIGURATOR"), jsonData.lendPoolConfiguratorProxyAddress)
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("BNFT_REGISTRY"), jsonData.bNFTRegistryProxyAddress);
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL_LOAN"), jsonData.lendPoolLoanProxyAddress);
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("RESERVE_ORACLE"), jsonData.mockReserveOracleProxyAddress);
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("NFT_ORACLE"), jsonData.nftOracleGetterProxyAddress);

});

task("init-pool", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner, addr1] = await hre.ethers.getSigners();



    // set lendpool admin
    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    const lendPoolAddressesProvider = LendPoolAddressesProvider.attach(jsonData.lendPoolAddressesProviderAddress);

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });

    const lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    await lendPoolAddressesProvider.setPoolAdmin(owner.address);



    // init reserve
    const initReserveInput: any = [[jsonData.burnLockMTokenImplAddress, jsonData.debtTokenImplAddress, 18, jsonData.interestRateAddress,jsonData.wETHAddress,owner.address,"WETH","MToken","MT","DebtToken","DT"]];
    await lendPoolConfigurator.batchInitReserve(initReserveInput, {gasLimit: 10000000});

    // init NFT
    const initNftInput: any = [[jsonData.mintableERC721Address]];
    await lendPoolConfigurator.batchInitNft(initNftInput, {gasLimit: 2000000});

    
    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // load the json file

        saveJsonFile(path, jsonData);
    }
});

task("contraction-configuration", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner, addr1] = await hre.ethers.getSigners();


    const erc20Assets = [jsonData.wETHAddress];
    const nftAssets = [jsonData.mintableERC721Address];

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });

  
    const aLendPoolConfiguratorProxy = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    await aLendPoolConfiguratorProxy.setBorrowingFlagOnReserve(erc20Assets, true);
    // set reserve interest rate address
    await aLendPoolConfiguratorProxy.setReserveInterestRateAddress(erc20Assets,jsonData.interestRateAddress);
    await aLendPoolConfiguratorProxy.setNftMaxSupplyAndTokenId(nftAssets,9999,9999999);
    await aLendPoolConfiguratorProxy.setBorrowingFlagOnReserve(erc20Assets, true);
    await aLendPoolConfiguratorProxy.setActiveFlagOnReserve(erc20Assets, true);
    // position 64. 1% -> 100
    await aLendPoolConfiguratorProxy.setReserveFactor(erc20Assets,3000);
    await aLendPoolConfiguratorProxy.setReserveInterestRateAddress(erc20Assets,jsonData.interestRateAddress);
    // 1% -> 100     address, ltv, liquidationThreshold, liquidationBonus, liquidatingBuyBonus
    await aLendPoolConfiguratorProxy.configureNftAsCollateral(nftAssets, 5000, 5000, 1000, 500);
    // (nftaddress, redeemDuration-hours, auctionDuration-hours, percentage: 1% = 100)
    await lendPoolConfigurator.configureNftAsAuction(erc20Assets, 12,24, 500);
    //}


    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // load the json file

        saveJsonFile(path, jsonData);
    }
});

task("init-pool", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner, addr1] = await hre.ethers.getSigners();



    // set lendpool admin
    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    const lendPoolAddressesProvider = LendPoolAddressesProvider.attach(jsonData.lendPoolAddressesProviderAddress);

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });

    const lendPoolConfigurator = LendPoolConfigurator.attach(jsonData.lendPoolConfiguratorProxyAddress);

    await lendPoolAddressesProvider.setPoolAdmin(owner.address);



    // init reserve
    const initReserveInput: any = [[jsonData.burnLockMTokenImplAddress, jsonData.debtTokenImplAddress, 18, jsonData.interestRateAddress,jsonData.wETHAddress,owner.address,"WETH","MToken","MT","DebtToken","DT"]];
    await lendPoolConfigurator.batchInitReserve(initReserveInput, {gasLimit: 10000000});

    // init NFT
    const initNftInput: any = [[jsonData.mintableERC721Address]];
    await lendPoolConfigurator.batchInitNft(initNftInput, {gasLimit: 2000000});

    
    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // load the json file

        saveJsonFile(path, jsonData);
    }
});

task("set-oracle-value", " Init the proxy contracts")
  .addParam("nftaddress", "The address of the nft asset")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const oneEther8Decimals = hre.ethers.BigNumber.from("100000000");
    // Set NFT price
    const key: string = "Ethereum-" + taskArgs.nftaddress;

    const MockDIAOracle = await hre.ethers.getContractFactory("MockDIAOracle");
    const mockDIAOracle = MockDIAOracle.attach(jsonData.mockDIAOracleAddress);

    const tx = await mockDIAOracle.setValue(key, oneEther8Decimals.div(10),oneEther8Decimals.div(10),0,0,0,1684382846);

    await tx.wait();
    console.log("Set NFT price success", tx.hash);

});


task("deposit-borrow", " Init the proxy contracts")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner, addr1] = await hre.ethers.getSigners();

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");

    const LendPool = await hre.ethers.getContractFactory("LendPool", {
      libraries: {
        SupplyLogic: jsonData.supplyLogicAddress,
        BorrowLogic: jsonData.borrowLogicAddress,
        LiquidateLogic: jsonData.liquidateLogicAddress,
        ReserveLogic: jsonData.reserveLogicAddress,
        NftLogic: jsonData.nftLogicAddress
      },
    });

    const lendPool = LendPool.attach(jsonData.lendPoolProxyAddress);

    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    const mintableERC721 = MintableERC721.attach(jsonData.mintableERC721Address);
    await  mintableERC721.approve(lendPool.address, 3);

    const WETH9Mocked = await hre.ethers.getContractFactory("WETH9Mocked");
    const wETH = WETH9Mocked.attach(jsonData.wETHAddress);


    let reserveData = await lendPool.getReserveData(jsonData.wETHAddress);

    // // mint ETH
    await wETH.mint(oneEther.mul(1));
    await wETH.approve(lendPool.address,oneEther.mul(1000));


    // // deposit
    const tx= await lendPool.deposit(wETH.address,oneEther,owner.address,0,0,{gasLimit:10000000});
    console.log(tx.hash);
    // // mint NFT
    // await mintableERC721.mint(1);
    // await mintableERC721.approve(lendPool.address, 0);

    //borrow
    // await lendPool.borrow(wETH.address, oneEther.div(2), mintableERC721.address, 3, owner.address,0 ,{gasLimit:5000000});

});

task("deploy-gateway", "Deploy WETH Gateway")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const [owner, addr1] = await hre.ethers.getSigners();


    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = await WETHGateway.deploy();
    await wETHGateway.deployed();

    console.log("WETHGateway deployed to",wETHGateway.address)

    await wETHGateway.initialize(jsonData.lendPoolAddressesProviderAddress, jsonData.wETHAddress,{gasLimit: 1000000});

    await wETHGateway.approveNFTTransfer(jsonData.mintableERC721Address, true, {gasLimit: 1000000});

    if(taskArgs.update){
        const path = './tasks/deploys/mainnetContractAddresses.json';
        console.log("Start to update addresses");
        // // load the json file
        jsonData.wETHGatewayAddress = wETHGateway.address;

        saveJsonFile(path, jsonData);
    }
});

task("get-reserve-data", "Get contract address from address provider")
  .setAction(async ( taskArgs,hre ) => {


    // const oneEther = hre.ethers.BigNumber.from("1000000000000000000");


    // Load logic address
    const path = './tasks/deploys/mainnetContractAddresses.json';
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

    const lendPool = LendPool.attach(jsonData.lendPoolProxyAddress);

    const reserveData = await lendPool.getReserveData(jsonData.wETHAddress);
    console.log("reserveData: ", reserveData);

});