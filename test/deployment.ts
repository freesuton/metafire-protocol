import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFunction } from "hardhat/internal/hardhat-network/stack-traces/model";



describe("Lend Protocol", function () {
  console.log("------start test -------");
  const oneEther = ethers.BigNumber.from("1000000000000000000");
  const ray = ethers.BigNumber.from("1000000000000000000000000000");

  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ONE_GWEI = 1_000_000_000;

  let validationLogic: any;
  let supplyLogic: any;
  let borrowLogic: any;
  let liquidateLogic: any;
  let reserveLogic: any;
  let nftLogic: any;
  let configuratorLogic: any;

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

  describe("Deploy and Init LendPool", async function () {

    it("Deploy LendPool", async function () {
      const LendPool = await ethers.getContractFactory("LendPool", {
        libraries: {
          SupplyLogic: supplyLogic.address,
          BorrowLogic: borrowLogic.address,
          LiquidateLogic: liquidateLogic.address,
          ReserveLogic: reserveLogic.address,
          NftLogic: nftLogic.address
        },
      });
      const lendPool = await LendPool.deploy();
      await lendPool.deployed();

      console.log("LendPool Address: "+ lendPool.address);
    });

    it("Init LendPool", async function () {
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
      const lendPool = await LendPool.deploy();
      await lendPool.initialize(lendPoolAddressesProvider.address);
    })
  })

  describe("Deploy and Init Proxy contracts", async function () {
    it("Deploy Proxy", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const LendPool = await ethers.getContractFactory("LendPool", {
        libraries: {
          SupplyLogic: supplyLogic.address,
          BorrowLogic: borrowLogic.address,
          LiquidateLogic: liquidateLogic.address,
          ReserveLogic: reserveLogic.address,
          NftLogic: nftLogic.address
        },
      });
      const lendPool = await LendPool.deploy();
      await lendPool.deployed();

      const MetaFireUpgradeableProxy = await ethers.getContractFactory("MetaFireUpgradeableProxy");
      const metaFireUpgradeableProxy = await MetaFireUpgradeableProxy.deploy(lendPool.address, owner.address,'0x');
      
      console.log("Proxy Address: "+ metaFireUpgradeableProxy.address);
    })


    it("Set Proxy Admin", async function () {
      const [owner, addr1] = await ethers.getSigners();

      // Deploy Lend Pool
      const LendPool = await ethers.getContractFactory("LendPool", {
        libraries: {
          SupplyLogic: supplyLogic.address,
          BorrowLogic: borrowLogic.address,
          LiquidateLogic: liquidateLogic.address,
          ReserveLogic: reserveLogic.address,
          NftLogic: nftLogic.address
        },
      });
      const lendPool = await LendPool.deploy();
      await lendPool.deployed();

      // Deploy Proxy
      const MetaFireUpgradeableProxy = await ethers.getContractFactory("MetaFireUpgradeableProxy");
      const metaFireUpgradeableProxy = await MetaFireUpgradeableProxy.deploy(lendPool.address, owner.address,'0x');
      await metaFireUpgradeableProxy.deployed();

      // Deploy Proxy Admin
      const MetaFireProxyAdmin = await ethers.getContractFactory("MetaFireProxyAdmin");
      const metaFireProxyAdmin = await MetaFireProxyAdmin.deploy();

      let admin  = await metaFireUpgradeableProxy.callStatic.admin();
      expect(admin).to.equal(owner.address);

      await metaFireUpgradeableProxy.changeAdmin(metaFireProxyAdmin.address);
      admin =  await metaFireProxyAdmin.getProxyAdmin(metaFireUpgradeableProxy.address);
      expect(admin).to.equal(metaFireProxyAdmin.address);
      // console.log("admin Address: "+ admin1);
    });
  })

  describe("Deploy and Init Address Provider", async function () {
    it("Deploy Address Provider Contract", async function () {
      const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
      const lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");
      console.log("Address Provider Address: "+ lendPoolAddressesProvider.address);
    })

    it("Deploy Address Provider Registry Contract", async function () {
      const LendPoolAddressesProviderRegistry = await ethers.getContractFactory("LendPoolAddressesProviderRegistry");
      const lendPoolAddressesProviderRegistry = await LendPoolAddressesProviderRegistry.deploy();
      console.log("Address Provider Registry Address: "+ lendPoolAddressesProviderRegistry.address);
    })

    it("Register Address Provider", async function () {
      const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
      const lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");

      const LendPoolAddressesProviderRegistry = await ethers.getContractFactory("LendPoolAddressesProviderRegistry");
      const lendPoolAddressesProviderRegistry = await LendPoolAddressesProviderRegistry.deploy();

      await lendPoolAddressesProviderRegistry.registerAddressesProvider(lendPoolAddressesProvider.address, 1);
      const registeredProvider = await lendPoolAddressesProviderRegistry.getAddressesProvidersList();
      console.log(registeredProvider[0]);
      expect(registeredProvider[0]).to.equal(lendPoolAddressesProvider.address);
    })
  })

  describe("Deploy and Init Configurator and Interest Strategy", async function () {
    it("Deploy Interest Rate Strategy Contract", async function () {
      const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
      const lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");
  
      const InterestRate = await ethers.getContractFactory("InterestRate");
      const interestRate = await InterestRate.deploy(lendPoolAddressesProvider.address,ray.div(100).mul(65),ray.div(100).mul(8),ray.div(100).mul(10),ray);
      console.log("Interest rate Strategy contract Address: "+ interestRate.address);
    })
  
    it("Deploy LendPoolConfigurator Contract", async function () {
      const LendPoolConfigurator = await ethers.getContractFactory("LendPoolConfigurator", {
        libraries: {
          ConfiguratorLogic: configuratorLogic.address,
        },
      });
      const lendPoolConfigurator = await LendPoolConfigurator.deploy();
      console.log("LendPoolConfigurator contract Address: "+ lendPoolConfigurator.address);
    })
  })
})