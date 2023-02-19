import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractFunction } from "hardhat/internal/hardhat-network/stack-traces/model";
import { any } from "hardhat/internal/core/params/argumentTypes";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721} from "../typechain-types/contracts/mock";
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain-types/contracts/libraries/logic"
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate,MToken, DebtToken} from "../typechain-types/contracts/protocol"

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

  // Contracts
  let metaFireUpgradeableProxy: any;
  let metaFireProxyAdmin: any;
  let lendPool: LendPool;
  let lendPoolLoan: LendPoolLoan;
  let lendPoolConfigurator: LendPoolConfigurator;
  let lendPoolAddressesProvider: LendPoolAddressesProvider;
  let interestRate: InterestRate;
  let wETH: WETH9Mocked;
  let mTokenimpl: MToken;
  let debtTokenImpl: DebtToken;
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

    const LendPoolLoan = await ethers.getContractFactory("LendPoolLoan");
    lendPoolLoan = await LendPoolLoan.deploy();
    await lendPoolLoan.initialize(lendPoolAddressesProvider.address);

    const LendPoolConfigurator = await ethers.getContractFactory("LendPoolConfigurator", {
      libraries: {
        ConfiguratorLogic: configuratorLogic.address,
      },
    });
    lendPoolConfigurator = await LendPoolConfigurator.deploy();
    await lendPoolConfigurator.initialize(lendPoolAddressesProvider.address);

    const InterestRate = await ethers.getContractFactory("InterestRate");
    // U: 65%, BR:10%, S1: 8%, d2: 100%
    interestRate = await InterestRate.deploy(lendPoolAddressesProvider.address,ray.div(100).mul(65),ray.div(10),ray.div(100).mul(8),ray);

    const WETH9Mocked = await ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();

    const DebtTokenImpl = await ethers.getContractFactory("DebtToken");
    debtTokenImpl = await DebtTokenImpl.deploy();

    const MintableERC721 = await ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");

    const MTokenImpl = await ethers.getContractFactory("MToken");
    mTokenimpl = await MTokenImpl.deploy();

    const BNFT = await ethers.getContractFactory("BNFT");
    bNFT = await BNFT.deploy();

    const BNFTRegistry = await ethers.getContractFactory("BNFTRegistry");
    bNFTRegistry = await BNFTRegistry.deploy();
    // Init BNFT Registry
    await bNFTRegistry.initialize(bNFT.address,"M","M");
    // Create Proxy and init IMPL
    await bNFTRegistry.createBNFT(mintableERC721.address);

    // Oracle
    const MockNFTOracle = await ethers.getContractFactory("MockNFTOracle");
    mockNFTOracle = await MockNFTOracle.deploy();
    await mockNFTOracle.initialize(owner.address,oneEther.div(10).mul(2),oneEther.div(10),30,10,600);
    const MockReserveOracle = await ethers.getContractFactory("MockReserveOracle");
    mockReserveOracle = await MockReserveOracle.deploy();
    await mockReserveOracle.initialize(wETH.address);

    // address setting
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL"), lendPool.address)
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL_CONFIGURATOR"), lendPoolConfigurator.address)
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("BNFT_REGISTRY"), bNFTRegistry.address);
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL_LOAN"), lendPoolLoan.address)
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("RESERVE_ORACLE"), mockReserveOracle.address)
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("NFT_ORACLE"), mockNFTOracle.address)
    // set lendpool admin
    await lendPoolAddressesProvider.setPoolAdmin(owner.address);

    // init reserve
    const initReserveInput: any = [[mTokenimpl.address, debtTokenImpl.address, 18, interestRate.address,wETH.address,owner.address,"WETH","MToken","MT","DebtToken","DT"]];
    await lendPoolConfigurator.batchInitReserve(initReserveInput);

    // init NFT
    const initNftInput: any = [[mintableERC721.address]];
    await lendPoolConfigurator.batchInitNft(initNftInput);

    // configuration
    //{
    erc20Assets = [wETH.address];
    nftAssets = [mintableERC721.address];

    await lendPoolConfigurator.setBorrowingFlagOnReserve(erc20Assets, true);
    // set reserve interest rate address
    await lendPoolConfigurator.setReserveInterestRateAddress(erc20Assets,interestRate.address);
    await lendPoolConfigurator.setNftMaxSupplyAndTokenId(nftAssets,50,0);
    await lendPoolConfigurator.setBorrowingFlagOnReserve(erc20Assets, true);
    await lendPoolConfigurator.setActiveFlagOnReserve(erc20Assets, true);
    // position 64. 1% -> 100
    await lendPoolConfigurator.setReserveFactor(erc20Assets,3000);
    await lendPoolConfigurator.setReserveInterestRateAddress(erc20Assets,interestRate.address);
    // 1% -> 100     address, ltv, liquidationThreshold, liquidationBonus
    await lendPoolConfigurator.configureNftAsCollateral(nftAssets, 5000, 5000, 500);
    //}

  })

  describe("Deposit and Borrow", async function () {

    let reserveData;
    let nftData;
    it("Deposit and Withdraw", async function () {

      reserveData = await lendPool.getReserveData(wETH.address);
      // instantiate mtoken proxy contract
      const proxy = mTokenimpl.attach(reserveData.mTokenAddress);
      
      await wETH.mint(oneEther.mul(10));
      await wETH.approve(lendPool.address,oneEther.mul(100));
      await wETH.approve(reserveData.mTokenAddress,oneEther.mul(100));

      // console.log("balance "+ await wETH.balanceOf(owner.address))
      await lendPool.deposit(wETH.address, oneEther, owner.address,0);
      const deposited = await proxy.balanceOf(owner.address);
      // console.log("balance after deposited"+ await wETH.balanceOf(owner.address))
      expect(deposited).to.equal(oneEther);

      await lendPool.withdraw(wETH.address, oneEther, owner.address);
      const withdrawed = await wETH.balanceOf(owner.address);
      expect(withdrawed).to.equal(oneEther.mul(10));
    })

    it("Interest calculation of Deposit, Borrow, Repay", async function () {

      // set nft oracle price to 2 ethers
      await mockNFTOracle.setAssets(nftAssets);
      await mockNFTOracle.setAssetData(mintableERC721.address, oneEther.mul(2));
      const nftPrice = await mockNFTOracle.getAssetPrice(mintableERC721.address);
      expect(nftPrice).to.equal(oneEther.mul(2));
      
      // set reserve asset price 1 ether
      const price = await mockReserveOracle.getAssetPrice(wETH.address);
      expect(price).to.equal(oneEther);

      reserveData = await lendPool.getReserveData(wETH.address);
      // console.log(reserveData);

      // mint ETH
      await wETH.mint(oneEther.mul(10));
      await wETH.approve(lendPool.address,oneEther.mul(100));
      await wETH.approve(reserveData.mTokenAddress,oneEther.mul(100));

      // mint NFT
      await mintableERC721.mint(0);
      await mintableERC721.approve(lendPool.address, 0);

      await lendPool.deposit(wETH.address, oneEther.mul(1), owner.address,0);
      // await lendPool.borrow(wETH.address, oneEther.div(10).mul(8), mintableERC721.address, 0, owner.address,0 );
      await lendPool.borrow(wETH.address, oneEther.div(2), mintableERC721.address, 0, owner.address,0 );
      
      reserveData = await lendPool.getReserveData(wETH.address);
      let liquidityRate = reserveData[3].mul(100).div(ray);
      let borrowRate = reserveData[4].mul(100).div(ray);
      expect(liquidityRate).to.equal(5);
      expect(borrowRate).to.equal(16);

      await lendPool.repay(mintableERC721.address, 0, oneEther.div(10000000));
      let balanceofNFT = await mintableERC721.balanceOf(owner.address);
      expect(balanceofNFT).to.equal(0);

      await lendPool.repay(mintableERC721.address, 0, oneEther);
      balanceofNFT = await mintableERC721.balanceOf(owner.address);
      expect(balanceofNFT).to.equal(1);
    })

    it("Auction and Liquidate", async function () {
      // set nft oracle price to 2 ethers
      await mockNFTOracle.setAssets(nftAssets);
      await mockNFTOracle.setAssetData(mintableERC721.address, oneEther.mul(1));

      reserveData = await lendPool.getReserveData(wETH.address);

      // mint ETH
      await wETH.mint(oneEther.mul(10));
      await wETH.approve(lendPool.address,oneEther.mul(100));
      await wETH.approve(reserveData.mTokenAddress,oneEther.mul(100));

      // mint ETH
      await wETH.connect(addr1).mint(oneEther.mul(10));
      await wETH.connect(addr1).approve(lendPool.address,oneEther.mul(100));
      await wETH.connect(addr1).approve(reserveData.mTokenAddress,oneEther.mul(100));

      // mint NFT
      await mintableERC721.mint(0);
      await mintableERC721.approve(lendPool.address, 0);

      //deposit 2 ether
      await lendPool.deposit(wETH.address, oneEther.mul(2), owner.address,0);
      // borrow 50% of collateral
      await lendPool.borrow(wETH.address, oneEther.div(2), mintableERC721.address, 0, owner.address,0 );

      let nftDebtData = await lendPool.getNftDebtData(mintableERC721.address, 0);
      let healthFactor = nftDebtData[5];
      expect(healthFactor).to.equal(oneEther);

      await ethers.provider.send("evm_increaseTime", [3600*24*365]);
      await ethers.provider.send("evm_mine");

      nftDebtData = await lendPool.getNftDebtData(mintableERC721.address, 0);
      healthFactor = nftDebtData[5];
      expect(healthFactor).lessThan(oneEther);
      
      // auction
      await lendPool.connect(addr1).auction(mintableERC721.address, 0, oneEther, addr1.address);
      let auctionData = await lendPool.getNftAuctionData(mintableERC721.address, 0);
      let nftAuctionEndTime = await lendPool.getNftAuctionEndTime(mintableERC721.address, 0);
      // console.log("------");
      // console.log(auctionData);
      // console.log(nftAuctionEndTime);

      await ethers.provider.send("evm_increaseTime", [3600*24*2]);
      await ethers.provider.send("evm_mine");

      await lendPool.liquidate(mintableERC721.address, 0, 0);
      const addr1NftBalance = await mintableERC721.balanceOf(addr1.address);
      expect(addr1NftBalance).to.equal(1);
    })

  })

})