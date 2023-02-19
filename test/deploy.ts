import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721} from "../typechain-types/contracts/mock";
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain-types/contracts/libraries/logic"
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate,MToken, DebtToken} from "../typechain-types/contracts/protocol"
import {MetaFireProxyAdmin, MetaFireUpgradeableProxy} from "../typechain-types/contracts/libraries/proxy";

describe("MetaFire Protocol Main Functions", async function () {
  console.log("------start test -------");
  const oneEther = ethers.BigNumber.from("1000000000000000000");
  const ray = ethers.BigNumber.from("1000000000000000000000000000");
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ONE_DAY = 3600 * 24;
  const ONE_MONTH = 3600 * 24 * 30;
  const ONE_GWEI = 1_000_000_000;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  let erc20Assets: any;
  let nftAssets: any;
  
  // Libraries
  let validationLogic: any;
  let supplyLogic: SupplyLogic;
  let borrowLogic: BorrowLogic;
  let liquidateLogic: LiquidateLogic;
  let reserveLogic: ReserveLogic;
  let nftLogic: any;
  let configuratorLogic: ConfiguratorLogic;

  // Contracts; 'a' means "attached"
  let metaFireProxyAdmin: MetaFireProxyAdmin;
  let metaFireUpgradeableProxy: MetaFireUpgradeableProxy;

  let aLendPoolProxy: LendPool;
  let aLendPoolLoanProxy: LendPoolLoan;
  let aLendPoolConfiguratorProxy: LendPoolConfigurator;
  let aLendPoolAddressesProviderProxy: LendPoolAddressesProvider;

  let aBNFTRegistryProxy: any;
  let aMockNFTOracleProxy: MockNFTOracle;
  let aMockReserveOracleProxy: MockReserveOracle;

  let aDebtTokenProxy: DebtToken;
  let aMTokenProxy: MToken;
  
  let lendPool: LendPool;
  let lendPoolLoan: LendPoolLoan;
  let lendPoolConfigurator: LendPoolConfigurator;
  let lendPoolAddressesProvider: LendPoolAddressesProvider;
  let interestRate: InterestRate;
  let wETH: WETH9Mocked;
  let mToken: MToken;
  let debtToken: DebtToken;
  let mintableERC721: MintableERC721;
  let bNFT: any;
  let bNFTRegistry: any;
  let mockNFTOracle: MockNFTOracle;
  let mockReserveOracle: MockReserveOracle;




  this.beforeEach(async () => {

    [owner, addr1] = await ethers.getSigners();

    // Deploy and init needed contracts
    const ValidationLogic = await ethers.getContractFactory("ValidationLogic");
    validationLogic = await ValidationLogic.deploy();
    
    const SupplyLogic = await ethers.getContractFactory("SupplyLogic", {libraries: {ValidationLogic: validationLogic.address }});
    supplyLogic = await SupplyLogic.deploy();

    const BorrowLogic = await ethers.getContractFactory("BorrowLogic", {libraries: {ValidationLogic: validationLogic.address}});
    borrowLogic = await BorrowLogic.deploy();

    const LiquidateLogic = await ethers.getContractFactory("LiquidateLogic", {libraries: {ValidationLogic: validationLogic.address}});
    liquidateLogic = await LiquidateLogic.deploy();

    const ReserveLogic = await ethers.getContractFactory("ReserveLogic");
    reserveLogic = await ReserveLogic.deploy();
    
    const NftLogic = await ethers.getContractFactory("NftLogic");
    nftLogic = await NftLogic.deploy();

    const ConfiguratorLogic = await ethers.getContractFactory("ConfiguratorLogic");
    configuratorLogic = await ConfiguratorLogic.deploy();

    const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("GenesisMarket");

   
    /*
      Deploy implementation contracts 
    */ 
    const LendPool = await ethers.getContractFactory("LendPool", {
      libraries: {
        SupplyLogic: supplyLogic.address,
        BorrowLogic: borrowLogic.address,
        LiquidateLogic: liquidateLogic.address,
        ReserveLogic: reserveLogic.address,
        NftLogic: nftLogic.address
      },
    });
    lendPool = await LendPool.deploy();

    const LendPoolLoan = await ethers.getContractFactory("LendPoolLoan");
    lendPoolLoan = await LendPoolLoan.deploy();

    const LendPoolConfigurator = await ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: configuratorLogic.address,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.deploy();

    const BNFTRegistry = await ethers.getContractFactory("BNFTRegistry");
    bNFTRegistry = await BNFTRegistry.deploy();

    // Oracle
    const MockNFTOracle = await ethers.getContractFactory("MockNFTOracle");
    mockNFTOracle = await MockNFTOracle.deploy();
    const MockReserveOracle = await ethers.getContractFactory("MockReserveOracle");
    mockReserveOracle = await MockReserveOracle.deploy();

    /**
     * Deploy sub contracts
     */
    const InterestRate = await ethers.getContractFactory("InterestRate");
    // U: 65%, BR:10%, S1: 8%, d2: 100%
    interestRate = await InterestRate.deploy(lendPoolAddressesProvider.address,ray.div(100).mul(65),ray.div(10),ray.div(100).mul(8),ray);

    const WETH9Mocked = await ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();

    const DebtTokenImpl = await ethers.getContractFactory("DebtToken");
    debtToken = await DebtTokenImpl.deploy();

    const MintableERC721 = await ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");

    const MToken = await ethers.getContractFactory("MToken");
    mToken = await MToken.deploy();

    const BNFT = await ethers.getContractFactory("BNFT");
    bNFT = await BNFT.deploy();

    /**
     * Deploy Proxy
     */
    const MetaFireProxyAdmin = await ethers.getContractFactory("MetaFireProxyAdmin");
    metaFireProxyAdmin = await MetaFireProxyAdmin.deploy();

    const MetaFireUpgradeableProxy = await ethers.getContractFactory("MetaFireUpgradeableProxy");
    const lendPoolProxy = await MetaFireUpgradeableProxy.deploy(lendPool.address,metaFireProxyAdmin.address,"0x");
    const lendPoolLoanProxy = await MetaFireUpgradeableProxy.deploy(lendPoolLoan.address,metaFireProxyAdmin.address,"0x");
    const lendPoolConfiguratorProxy = await MetaFireUpgradeableProxy.deploy(lendPoolConfigurator.address,metaFireProxyAdmin.address,"0x");
    // const lendPoolAddressesProviderProxy = await MetaFireUpgradeableProxy.deploy(lendPoolAddressesProvider.address,metaFireProxyAdmin.address,"0x");
    const bNFTRegistryProxy = await MetaFireUpgradeableProxy.deploy(bNFTRegistry.address,metaFireProxyAdmin.address,"0x");
    const mockNFTOracleProxy = await MetaFireUpgradeableProxy.deploy(mockNFTOracle.address,metaFireProxyAdmin.address,"0x");
    const mockReserveOracleProxy = await MetaFireUpgradeableProxy.deploy(mockReserveOracle.address,metaFireProxyAdmin.address,"0x");
    const debtTokenProxy = await MetaFireUpgradeableProxy.deploy(debtToken.address,metaFireProxyAdmin.address, "0x");
    const mTokenProxy = await MetaFireUpgradeableProxy.deploy(mToken.address,metaFireProxyAdmin.address, "0x");
    /**
     * Attach implementation contracts to proxies
     */
    aLendPoolProxy = await lendPool.attach(lendPoolProxy.address);
    aLendPoolLoanProxy = await lendPoolLoan.attach(lendPoolLoanProxy.address);
    aLendPoolConfiguratorProxy = await lendPoolConfigurator.attach(lendPoolConfiguratorProxy.address);
    // aLendPoolAddressesProviderProxy = await lendPoolAddressesProvider.attach(lendPoolAddressesProviderProxy.address);
    aBNFTRegistryProxy = await bNFTRegistry.attach(bNFTRegistryProxy.address);
    aMockNFTOracleProxy = await mockNFTOracle.attach(mockNFTOracleProxy.address);
    aMockReserveOracleProxy = await mockReserveOracle.attach(mockReserveOracleProxy.address);
    // aDebtTokenProxy = await debtToken.attach(debtTokenProxy.address);
    // aMTokenProxy = await mToken.attach(mTokenProxy.address);

    /**
     * Init contract 
     */
    // Init addressesProvider
    // const marketId = ethers.utils.formatBytes32String("GenesisMarket");
    // await lendPoolAddressesProvider.setAddress(marketId, aLendPoolAddressesProviderProxy.address);
    // let gMarketAddressesProviderAddress = await lendPoolAddressesProvider.getAddress(marketId);

    await aLendPoolProxy.initialize(lendPoolAddressesProvider.address);
    await aLendPoolLoanProxy.initialize(lendPoolAddressesProvider.address);
    await aLendPoolConfiguratorProxy.initialize(lendPoolAddressesProvider.address);

    // Init BNFT Registry
    await aBNFTRegistryProxy.initialize(bNFT.address,"M","M");
    // Create Proxy and init IMPL
    await aBNFTRegistryProxy.createBNFT(mintableERC721.address);
    // await aMockNFTOracleProxy.initialize(owner.address,oneEther.div(10).mul(2),oneEther.div(10),30,10,600);
    // await aMockReserveOracleProxy.initialize(wETH.address);


    /**
     * Address provider setting
     */
     await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL"), aLendPoolProxy.address)
     await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL_CONFIGURATOR"), aLendPoolConfiguratorProxy.address)
     await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("BNFT_REGISTRY"), aBNFTRegistryProxy.address);
     await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL_LOAN"), aLendPoolLoanProxy.address)
     await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("RESERVE_ORACLE"), aMockReserveOracleProxy.address)
     await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("NFT_ORACLE"), aMockNFTOracleProxy.address)
     // set lendpool admin
     await lendPoolAddressesProvider.setPoolAdmin(owner.address);


    // init reserve
    const initReserveInput: any = [[mToken.address, debtToken.address, 18, interestRate.address,wETH.address,owner.address,"WETH","MToken","MT","DebtToken","DT"]];
    await aLendPoolConfiguratorProxy.batchInitReserve(initReserveInput);

    // init NFT
    const initNftInput: any = [[mintableERC721.address]];
    await aLendPoolConfiguratorProxy.batchInitNft(initNftInput);


    /**
     * Lend Pool Configuration
     */
    erc20Assets = [wETH.address];
    nftAssets = [mintableERC721.address];

    await aLendPoolConfiguratorProxy.setBorrowingFlagOnReserve(erc20Assets, true);
    // set reserve interest rate address
    await aLendPoolConfiguratorProxy.setReserveInterestRateAddress(erc20Assets,interestRate.address);
    await aLendPoolConfiguratorProxy.setNftMaxSupplyAndTokenId(nftAssets,50,0);
    await aLendPoolConfiguratorProxy.setBorrowingFlagOnReserve(erc20Assets, true);
    await aLendPoolConfiguratorProxy.setActiveFlagOnReserve(erc20Assets, true);
    // position 64. 1% -> 100
    await aLendPoolConfiguratorProxy.setReserveFactor(erc20Assets,3000);
    await aLendPoolConfiguratorProxy.setReserveInterestRateAddress(erc20Assets,interestRate.address);
    // 1% -> 100     address, ltv, liquidationThreshold, liquidationBonus
    await aLendPoolConfiguratorProxy.configureNftAsCollateral(nftAssets, 5000, 5000, 500);

  })
   
  describe("Configuration", async function () {
  
    it("", async function () {
      let impleReserveData;
      impleReserveData = await aLendPoolProxy.getReserveData(wETH.address);
      console.log(impleReserveData);

    })



  })

})