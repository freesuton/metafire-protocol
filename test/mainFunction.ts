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
  const ONE_DAY = 3600 * 24;
  const ONE_MONTH = 3600 * 24 * 30;
  const ONE_GWEI = 1_000_000_000;

  let owner: any;
  let addr1: any;
  let addr2: any;
  
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

    [owner, addr1] = await ethers.getSigners();
    
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

    // set lendpool admin
    await lendPoolAddressesProvider.setPoolAdmin(owner.address);

    //init reserve
    const initReserveInput = [[mTokenimpl.address, debtTokenImpl.address, 18, interestRate.address,wETH.address,owner.address,"WETH","BToken","BTOKEN","MTOKEN","MToken"]];
    await lendPoolConfigurator.batchInitReserve(initReserveInput);

  })

  describe("Deposit", async function () {

    let x;
    let y = 1;
    console.log("---------")
    let reserveData;

    it("Deposit and Withdraw", async function () {

      reserveData = await lendPool.getReserveData(wETH.address);

      await wETH.mint(oneEther);
      await wETH.approve(lendPool.address,oneEther.mul(100));
      await wETH.approve(reserveData.mTokenAddress,oneEther.mul(100));
      // await wETH.transferFrom(owner.address, lendPool.address, oneEther.div(10));
      // await wETH.safeTransferFrom(owner.address, reserveData.mTokenAddress, oneEther.div(10));
      
      console.log(await wETH.balanceOf(reserveData.mTokenAddress));
      console.log(await wETH.balanceOf(owner.address));
      console.log("allow"+ await wETH.allowance(owner.address, lendPool.address));
      await lendPool.deposit(wETH.address, oneEther, owner.address,0);
    })


  })

})