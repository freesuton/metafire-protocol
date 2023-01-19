import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFunction } from "hardhat/internal/hardhat-network/stack-traces/model";
import { any } from "hardhat/internal/core/params/argumentTypes";



describe("MetaFire Protocol Deployment", function () {
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
  let lendPool: any;
  let lendPoolConfigurator: any;
  let metaFireUpgradeableProxy: any;
  let metaFireProxyAdmin: any;
  let lendPoolAddressesProvider: any;

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



  })

  describe("Set Address to Address Provider", async function () {
    it("", async function () {
      const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
      const lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");

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

      // address needed for deposit
      await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL"), lendPool.address)
      const lendPoolAddress = await lendPoolAddressesProvider.getLendPool();
      
      await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL_CONFIGURATOR"), lendPoolConfigurator.address)
      const lendPoolConfiguratorAddress = await lendPoolAddressesProvider.getLendPoolConfigurator();

      //TODO: address needed for other

      expect(lendPoolAddress).to.equal(lendPool.address);
      expect(lendPoolConfiguratorAddress).to.equal(lendPoolConfigurator.address);
    })
  })

  describe("Init Reserve and NFT", async function () {
    it("Init Reserve", async function () {
      const [owner, addr1] = await ethers.getSigners();

      const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
      const lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");

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

      const DebtTokenImpl = await ethers.getContractFactory("DebtToken");
      const debtTokenImpl = await DebtTokenImpl.deploy();
  
      const MTokenImpl = await ethers.getContractFactory("MToken");
      const mTokenimpl = await MTokenImpl.deploy();

      const InterestRate = await ethers.getContractFactory("InterestRate");
      const interestRate = await InterestRate.deploy(lendPoolAddressesProvider.address,ray.div(100).mul(65),ray.div(100).mul(8),ray.div(100).mul(10),ray);
      
      const WETH9Mocked = await ethers.getContractFactory("WETH9Mocked");
      const wETH9Mocked = await WETH9Mocked.deploy();

      // address needed for deposit
      await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL"), lendPool.address)
      await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL_CONFIGURATOR"), lendPoolConfigurator.address)
      // set lendpool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);
      const lendPoolAddress = await lendPoolAddressesProvider.getLendPool();

      const initReserveInput = [[mTokenimpl.address, debtTokenImpl.address, 18, interestRate.address,wETH9Mocked.address,owner.address,"WETH","BToken","BTOKEN","MTOKEN","MToken"]];
      await lendPoolConfigurator.batchInitReserve(initReserveInput);
    })

    it("Init NFT", async function () {
      const [owner, addr1] = await ethers.getSigners();

      const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
      const lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");

    })
  })
})