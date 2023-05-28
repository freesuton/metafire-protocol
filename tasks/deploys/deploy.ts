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





task("deploy-logic", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {
    console.log("Start to deploy");


    const [owner, addr1] = await hre.ethers.getSigners();

    
    // Deploy and init needed contracts
    const ValidationLogic = await hre.ethers.getContractFactory("ValidationLogic");
    validationLogic = await ValidationLogic.deploy();
    await validationLogic.deployed();

    await delay(10000); // 10 seconds delay

    const SupplyLogic = await hre.ethers.getContractFactory("SupplyLogic", {libraries: {ValidationLogic: validationLogic.address }});
    supplyLogic = await SupplyLogic.deploy();
    await supplyLogic.deployed(); 

    
    const BorrowLogic = await hre.ethers.getContractFactory("BorrowLogic", {libraries: {ValidationLogic: validationLogic.address}});
    borrowLogic = await BorrowLogic.deploy();
    await borrowLogic.deployed();

    await delay(10000); // 10 seconds delay

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
});

// task("deploy-logic-2", "Deploy the logic contracts")
//   .addFlag("update", "Whether to update the logic contract addresses")
//   .setAction(async ( taskArgs , hre) => {
//     console.log("Start to deploy");


//     const [owner, addr1] = await hre.ethers.getSigners();
//     const path = './tasks/deploys/contractAddresses.json';
        
//     // load the json file
//     const jsonData = await loadJsonFile(path);
//     console.log(jsonData.validationLogicAddress);

    
//     // Deploy and init needed contracts
//     const ValidationLogic = await hre.ethers.getContractFactory("ValidationLogic");
//     validationLogic = await ValidationLogic.deploy();
//     await validationLogic.deployed();


//     try{
//         const LiquidateLogic = await hre.ethers.getContractFactory("LiquidateLogic", {libraries: {ValidationLogic : jsonData.validationLogicAddress}});
//         liquidateLogic = await LiquidateLogic.deploy();
//         await liquidateLogic.deployed();
//         console.log("LiquidateLogic deployed to:", liquidateLogic.address);

//         if(taskArgs.update){
//             console.log("Start to update addresses");
    
//             jsonData.liquidateLogicAddress = liquidateLogic.address;
//             saveJsonFile(path, jsonData);
//         }
    
//     }catch(e){
//         console.log(e);
//     }




    




// });


task("deploy-main", "Deploy the main contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);


    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");
    await lendPoolAddressesProvider.deployed();

    await delay(10000); // 10 seconds delay

    const LendPool = await hre.ethers.getContractFactory("LendPool", {
      libraries: {
        SupplyLogic: jsonData.supplyLogicAddress,
        BorrowLogic: jsonData.borrowLogicAddress,
        LiquidateLogic: jsonData.liquidateLogicAddress,
        ReserveLogic: jsonData.reserveLogicAddress,
        NftLogic: jsonData.nftLogicAddress,
      },
    });
    lendPool = await LendPool.deploy();
    await lendPool.initialize(lendPoolAddressesProvider.address);

    await delay(10000); // 10 seconds delay

    const LendPoolLoan = await hre.ethers.getContractFactory("LendPoolLoan");
    lendPoolLoan = await LendPoolLoan.deploy();
    await lendPoolLoan.initialize(lendPoolAddressesProvider.address);

    await delay(10000); // 10 seconds delay

    const LendPoolConfigurator = await hre.ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: jsonData.configuratorLogicAddress,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.deploy();
    await lendPoolConfigurator.initialize(lendPoolAddressesProvider.address);

    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.lendPoolAddressesProviderAddress = lendPoolAddressesProvider.address;
        jsonData.lendPoolAddress = lendPool.address;
        jsonData.lendPoolLoanAddress = lendPoolLoan.address;
        jsonData.lendPoolConfiguratorAddress = lendPoolConfigurator.address;

        saveJsonFile(path, jsonData);
    }
});


task("deploy-interest", "Deploy the interest strategy contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);


    const InterestRate = await hre.ethers.getContractFactory("InterestRate");
    // U: 65%, BR:10%, S1: 8%, d2: 100%
    // distributeCoefficients_： 2:3:4:5
    const distributeCoefficients:[BigNumber, BigNumber, BigNumber, BigNumber]= [ray,ray.mul(2),ray.mul(3),ray.mul(4)];
    interestRate = await InterestRate.deploy(jsonData.lendPoolAddressesProviderAddress,ray.div(100).mul(65),ray.div(10),ray.div(100).mul(8),ray, distributeCoefficients);
    await interestRate.deployed();

    console.log("InterestRate deployed to:", interestRate.address);

    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.interestRateAddress = interestRate.address;
        saveJsonFile(path, jsonData);
    }
});

task("deploy-sub", "Deploy the sub contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {


    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");
    const ray = hre.ethers.BigNumber.from("1000000000000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);


    const WETH9Mocked = await hre.ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();
    await wETH.deployed();

    const DebtTokenImpl = await hre.ethers.getContractFactory("DebtToken");
    debtTokenImpl = await DebtTokenImpl.deploy();
    await debtTokenImpl.deployed();

    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");
    await mintableERC721.deployed();

    const BurnLockMTokenImpl = await hre.ethers.getContractFactory("BurnLockMToken");
    burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();
    await burnLockMTokenImpl.deployed();

    console.log("wETH deployed to:", wETH.address);
    console.log("debtTokenImpl deployed to:", debtTokenImpl.address);
    console.log("mintableERC721 deployed to:", mintableERC721.address);
    console.log("burnLockMTokenImpl deployed to:", burnLockMTokenImpl.address);

    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.wETHAddress = wETH.address;
        jsonData.debtTokenImplAddress = debtTokenImpl.address;
        jsonData.mintableERC721Address = mintableERC721.address;
        jsonData.burnLockMTokenImplAddress = burnLockMTokenImpl.address;
        saveJsonFile(path, jsonData);
    }
});

task("deploy-bnft", "Deploy nft related contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    const [owner, addr1] = await hre.ethers.getSigners();

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    const BNFT = await hre.ethers.getContractFactory("BNFT");
    bNFT = await BNFT.deploy();

    const BNFTRegistry = await hre.ethers.getContractFactory("BNFTRegistry");
    bNFTRegistry = await BNFTRegistry.deploy();
    // Init BNFT Registry
    await bNFTRegistry.initialize(bNFT.address,"M","M");

    // Create Proxy and init IMPL
    await bNFTRegistry.createBNFT(jsonData.mintableERC721Address);

    console.log("bNFT deployed to:", bNFT.address);
    console.log("bNFTRegistry deployed to:", bNFTRegistry.address);


    if(taskArgs.update){
        console.log("Start to update addresses");
        // load the json file
        jsonData.bNFTAddress = bNFT.address;
        jsonData.bNFTRegistryAddress = bNFTRegistry.address;
        saveJsonFile(path, jsonData);
    }
});

task("deploy-oracle", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    const [owner, addr1] = await hre.ethers.getSigners();

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    // Oracle
    const MockNFTOracle = await hre.ethers.getContractFactory("MockNFTOracle");
    mockNFTOracle = await MockNFTOracle.deploy();
    await mockNFTOracle.deployed();
    await mockNFTOracle.initialize(owner.address,oneEther.div(10).mul(2),oneEther.div(10),30,10,600);

    const MockReserveOracle = await hre.ethers.getContractFactory("MockReserveOracle");
    mockReserveOracle = await MockReserveOracle.deploy();

    await mockReserveOracle.deployed();
    await mockReserveOracle.initialize(jsonData.wETHAddress);

    console.log("mockNFTOracle deployed to:", mockNFTOracle.address);
    console.log("mockReserveOracle deployed to:", mockReserveOracle.address);


    if(taskArgs.update){
        const path = './tasks/deploys/contractAddresses.json';
        console.log("Start to update addresses");
        // load the json file
        jsonData.mockNFTOracleAddress = mockNFTOracle.address;
        jsonData.mockReserveOracleAddress = mockReserveOracle.address;
        saveJsonFile(path, jsonData);
    }
});

task("deploy-dia-oracle", "Deploy the logic contracts")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = loadJsonFile(path);

    // DIA Oracle
    const MockDIAOracle = await hre.ethers.getContractFactory("MockDIAOracle");
    mockDIAOracle = await MockDIAOracle.deploy();
    await mockDIAOracle.deployed();

    const AddressChecksumUtils = await hre.ethers.getContractFactory("AddressChecksumUtils");
    const addressChecksumUtils = await AddressChecksumUtils.deploy();
    await addressChecksumUtils.deployed();

    const NFTOracleGetter = await hre.ethers.getContractFactory("NFTOracleGetter",{libraries: {AddressChecksumUtils: addressCheckSumUtils.address}});
    nftOracleGetter = await NFTOracleGetter.deploy();
    await nftOracleGetter.deployed();

    if(taskArgs.update){
      const path = './tasks/deploys/contractAddresses.json';
      console.log("Start to update addresses");
      // load the json file
      jsonData.mockDIAOracleAddress = mockDIAOracle.address;
      jsonData.addressChecksumUtilsAddress = addressChecksumUtils.address;
      jsonData.nftOracleGetterAddress = nftOracleGetter.address;

      saveJsonFile(path, jsonData);
  }

})



task("set-deploy-addr", " Set deployed contracts addresses")
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    const [owner, addr1] = await hre.ethers.getSigners();

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const LendPoolAddressesProvider = await hre.ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.attach(jsonData.lendPoolAddressesProviderAddress);

    // address setting
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL"), jsonData.lendPoolAddress)
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL_CONFIGURATOR"), jsonData.lendPoolConfiguratorAddress)
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("BNFT_REGISTRY"), jsonData.bNFTRegistryAddress);
    
    await delay(5000);

    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("LEND_POOL_LOAN"), jsonData.lendPoolLoanAddress)
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("RESERVE_ORACLE"), jsonData.mockReserveOracleAddress)
    await lendPoolAddressesProvider.setAddress(hre.ethers.utils.formatBytes32String("NFT_ORACLE"), jsonData.mockNFTOracleAddress)

    // set lendpool admin
    await lendPoolAddressesProvider.setPoolAdmin(owner.address);
});

task("deploy-wETHGateway", "Deploy wETHGateway contract") 
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    const [owner, addr1] = await hre.ethers.getSigners();

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const WETHGateway = await hre.ethers.getContractFactory("WETHGateway");
    const wETHGateway = await WETHGateway.deploy();
    await wETHGateway.deployed();
    
    console.log(wETHGateway.address);
    console.log("lendpool address provider", jsonData.lendPoolAddressesProviderAddress);
    console.log("wETH address", jsonData.wETHAddress);
    await wETHGateway.initialize(jsonData.lendPoolAddressesProviderAddress, jsonData.wETHAddress,{gasLimit: 10000000});
   
    if(taskArgs.update){
      const path = './tasks/deploys/contractAddresses.json';
      console.log("Start to update addresses");
      // load the json file
      jsonData.wETHGatewayAddress = wETHGateway.address;
      saveJsonFile(path, jsonData);
  }
});


task("deploy-proxy-1", "Deploy proxy contract") 
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    const [owner, addr1] = await hre.ethers.getSigners();

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const MetaFireProxyAdmin = await hre.ethers.getContractFactory("MetaFireProxyAdmin");
    metaFireProxyAdmin = await MetaFireProxyAdmin.deploy();
    await metaFireProxyAdmin.deployed();

    const MetaFireUpgradeableProxy = await hre.ethers.getContractFactory("MetaFireUpgradeableProxy");

    const lendPoolProxy = await MetaFireUpgradeableProxy.deploy(jsonData.lendPoolAddress,metaFireProxyAdmin.address,"0x",{gasLimit: 10000000});
    await lendPoolProxy.deployed();

    const lendPoolLoanProxy = await MetaFireUpgradeableProxy.deploy(jsonData.lendPoolLoanAddress,metaFireProxyAdmin.address,"0x");
    await lendPoolLoanProxy.deployed();

    const lendPoolConfiguratorProxy = await MetaFireUpgradeableProxy.deploy(jsonData.lendPoolConfiguratorAddress,metaFireProxyAdmin.address,"0x");
    await lendPoolConfiguratorProxy.deployed();

    console.log("metaFireProxyAdmin deployed to:", metaFireProxyAdmin.address);
    console.log("lendPoolProxy deployed to:", lendPoolProxy.address);
    console.log("lendPoolLoanProxy deployed to:", lendPoolLoanProxy.address);
    console.log("lendPoolConfiguratorProxy deployed to:", lendPoolConfiguratorProxy.address);


    if(taskArgs.update){
      const path = './tasks/deploys/contractAddresses.json';
      console.log("Start to update addresses");
      // load the json file
      jsonData.metaFireProxyAdminAddress = metaFireProxyAdmin.address;
      jsonData.lendPoolLoanProxyAddress = lendPoolProxy.address;
      jsonData.lendPoolLoanProxyAddress = lendPoolLoanProxy.address;
      jsonData.lendPoolConfiguratorProxyAddress = lendPoolConfiguratorProxy.address;
      saveJsonFile(path, jsonData);
  }
});

  task("deploy-proxy-2", "Deploy proxy contract") 
  .addFlag("update", "Whether to update the logic contract addresses")
  .setAction(async ( taskArgs , hre) => {

    const [owner, addr1] = await hre.ethers.getSigners();

    const oneEther = hre.ethers.BigNumber.from("1000000000000000000");

    // Load logic address
    const path = './tasks/deploys/contractAddresses.json';
    const jsonData = await loadJsonFile(path);

    const MetaFireUpgradeableProxy = await hre.ethers.getContractFactory("MetaFireUpgradeableProxy");

    const bNFTRegistryProxy = await MetaFireUpgradeableProxy.deploy(jsonData.bNFTRegistryAddress,jsonData.metaFireProxyAdminAddress,"0x");
    await bNFTRegistryProxy.deployed();
    const mockNFTOracleProxy = await MetaFireUpgradeableProxy.deploy(jsonData.mockNFTOracleAddress,jsonData.metaFireProxyAdminAddress,"0x");
    await mockNFTOracleProxy.deployed();
    const mockReserveOracleProxy = await MetaFireUpgradeableProxy.deploy(jsonData.mockReserveOracleAddress,jsonData.metaFireProxyAdminAddress,"0x");
    await mockReserveOracleProxy.deployed();

    console.log("bNFTRegistryProxy deployed to:", bNFTRegistryProxy.address);
    console.log("mockNFTOracleProxy deployed to:", mockNFTOracleProxy.address);
    console.log("mockReserveOracleProxy deployed to:", mockReserveOracleProxy.address);



    if(taskArgs.update){
      const path = './tasks/deploys/contractAddresses.json';
      console.log("Start to update addresses");
      // load the json file
      jsonData.bNFTRegistryProxyAddress = bNFTRegistryProxy.address;
      jsonData.mockNFTOracleProxyAddress = mockNFTOracleProxy.address;
      jsonData.mockReserveOracleProxyAddress = mockReserveOracleProxy.address;

      saveJsonFile(path, jsonData);
  }
});

