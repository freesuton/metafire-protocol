import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFunction } from "hardhat/internal/hardhat-network/stack-traces/model";
import { any } from "hardhat/internal/core/params/argumentTypes";



describe("MetaFire Protocol Deployment", async function () {
  console.log("------start test -------");
  const oneEther = ethers.BigNumber.from("1000000000000000000");
  const ray = ethers.BigNumber.from("1000000000000000000000000000");
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ONE_GWEI = 1_000_000_000;
  

  // Libraries
  let validationLogic: any;
  let supplyLogic: any;
  let borrowLogic: any;
  let liquidateLogic: any;
  let reserveLogic: any;
  let nftLogic: any;
  let configuratorLogic: any;

  // Contracts
  let metaFireUpgradeableProxy: any;
  let metaFireProxyAdmin: any;
  let lendPool: any;
  let lendPoolConfigurator: any;
  let lendPoolAddressesProvider: any;
  let interestRate: any;
  let wETH: any;
  let mTokenimpl: any;
  let debtTokenImpl: any;
  let mintableERC721: any;

  this.beforeEach(async () => {
    

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
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");

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
    await lendPool.initialize(lendPoolAddressesProvider.address);

    const LendPoolConfigurator = await ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: configuratorLogic.address,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.deploy();
    await lendPoolConfigurator.initialize(lendPoolAddressesProvider.address);

    const InterestRate = await ethers.getContractFactory("InterestRate");
    interestRate = await InterestRate.deploy(lendPoolAddressesProvider.address,ray.div(100).mul(65),ray.div(100).mul(8),ray.div(100).mul(10),ray);

    const WETH9Mocked = await ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();

    const MintableERC721 = await ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");

    const MTokenImpl = await ethers.getContractFactory("MToken");
    mTokenimpl = await MTokenImpl.deploy();

    const DebtTokenImpl = await ethers.getContractFactory("DebtToken");
    debtTokenImpl = await DebtTokenImpl.deploy();

    // address setting
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL"), lendPool.address)
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL_CONFIGURATOR"), lendPoolConfigurator.address)

  })

  describe("Init Reserve and NFT", async function () {
    
    it("Init Reserve", async function () {
      
      const [owner, addr1] = await ethers.getSigners();

      // set lendpool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);

      const initReserveInput = [[mTokenimpl.address, debtTokenImpl.address, 18, interestRate.address,wETH.address,owner.address,"WETH","BToken","BTOKEN","MTOKEN","MToken"]];
      await lendPoolConfigurator.batchInitReserve(initReserveInput);
    })

    it("Init NFT", async function () {
      
      const [owner, addr1] = await ethers.getSigners();  

      const LendPoolLoan = await ethers.getContractFactory("LendPoolLoan");
      const lendPoolLoan = await LendPoolLoan.deploy();
      await lendPoolLoan.initialize(lendPoolAddressesProvider.address);

      const BNFT = await ethers.getContractFactory("BNFT");
      const bNFT = await BNFT.deploy();

      const BNFTRegistry = await ethers.getContractFactory("BNFTRegistry");
      const bNFTRegistry = await BNFTRegistry.deploy();

      const MintableERC721 = await ethers.getContractFactory("MintableERC721");
      const mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");

      await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("BNFT_REGISTRY"), bNFTRegistry.address);
      await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL_LOAN"), lendPoolLoan.address)
      
      // set lendpool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);
      
      // Init BNFT Registry
      await bNFTRegistry.initialize(bNFT.address,"M","M");
      // Create Proxy and init IMPL
      await bNFTRegistry.createBNFT(mintableERC721.address);

      const initNftInput = [[mintableERC721.address]];
      await lendPoolConfigurator.batchInitNft(initNftInput);

      const assets = [wETH.address];
      await lendPoolConfigurator.setBorrowingFlagOnReserve(assets, true);
    })
  })

  describe("Configuration", async function () {
  
    it("set Borrowing Flag On Reserve", async function () {
      const [owner, addr1] = await ethers.getSigners();  

      // set lendpool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);

      const assets = [wETH.address];

      // position 58
      await lendPoolConfigurator.setBorrowingFlagOnReserve(assets, true);
      const configuration = await lendPool.getReserveConfiguration(wETH.address);
      expect(configuration.data).to.equal(ethers.BigNumber.from("288230376151711744"));
    })

    it("set Active Flag On Reserve", async function () {
      const [owner, addr1] = await ethers.getSigners();  

      // set lendpool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);

      const assets = [wETH.address];

      // position 58
      await lendPoolConfigurator.setActiveFlagOnReserve(assets, true);
      const configuration = await lendPool.getReserveConfiguration(wETH.address);
      expect(configuration.data).to.equal(ethers.BigNumber.from("72057594037927936"));
    })

    it("set Reserve Factor", async function () {
      const [owner, addr1] = await ethers.getSigners();  

      // set lendpool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);

      const assets = [wETH.address];

      // position 64. 1% -> 100
      await lendPoolConfigurator.setReserveFactor(assets,100);
      const configuration = await lendPool.getReserveConfiguration(wETH.address);
      expect(configuration.data).to.equal(ethers.BigNumber.from("1844674407370955161600"));
    })

    it("set Reserve Interest Rate Address", async function () {
      const [owner, addr1] = await ethers.getSigners();  

      // set lendpool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);

      const assets = [wETH.address];

      await lendPoolConfigurator.setReserveInterestRateAddress(assets,interestRate.address);
      const reserveData = await lendPool.getReserveData(wETH.address);
      expect(reserveData.interestRateAddress).to.equal(interestRate.address);
    })

    it("configure Nft As Collateral", async function () {
      const [owner, addr1] = await ethers.getSigners();  

      // set lendpool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);
      

      const assets = [mintableERC721.address];
      // 1% -> 100     ltv, liquidationThreshold, liquidationBonus
      await lendPoolConfigurator.configureNftAsCollateral(assets,5000, 7000, 500);
      const nftData = await lendPool.getNftData(mintableERC721.address);
      expect(nftData.configuration.data).to.equal(ethers.BigNumber.from("2147942405000"));
    })

  })

  describe("TTTTTTT", async function () {
    const x= 1111;
    it("-------", async function () {
      console.log(x);
 
    })

  })
})