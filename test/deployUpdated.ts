import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721} from "../typechain-types/contracts/mock";
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain-types/contracts/libraries/logic"
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate, DebtToken, BurnLockMToken, WETHGateway} from "../typechain-types/contracts/protocol"
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
//   let aMTokenProxy: MToken;
  let aBurnLockMTokenProxy: BurnLockMToken;

  let wETHGateway: WETHGateway;
  
  let lendPool: LendPool;
  let lendPoolLoan: LendPoolLoan;
  let lendPoolConfigurator: LendPoolConfigurator;
  let lendPoolAddressesProvider: LendPoolAddressesProvider;
  let interestRate: InterestRate;
  let wETH: WETH9Mocked;
//   let mTokenimpl: MToken;
  let burnLockMTokenImpl: BurnLockMToken;
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
    // distributeCoefficients_： 2:3:4:5
    const distributeCoefficients= [ray,ray.mul(2),ray.mul(3),ray.mul(4)];
    interestRate = await InterestRate.deploy(lendPoolAddressesProvider.address,ray.div(100).mul(65),ray.div(10),ray.div(100).mul(8),ray, distributeCoefficients);
   

    const WETH9Mocked = await ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();

    const DebtTokenImpl = await ethers.getContractFactory("DebtToken");
    debtTokenImpl = await DebtTokenImpl.deploy();

    const MintableERC721 = await ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");

    const BurnLockMTokenImpl = await ethers.getContractFactory("BurnLockMToken");
    burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();

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
    const initReserveInput: any = [[burnLockMTokenImpl.address, debtTokenImpl.address, 18, interestRate.address,wETH.address,owner.address,"WETH","MToken","MT","DebtToken","DT"]];
    await lendPoolConfigurator.batchInitReserve(initReserveInput);

    // init NFT
    const initNftInput: any = [[mintableERC721.address]];
    await lendPoolConfigurator.batchInitNft(initNftInput);

    // configuration
    
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
   
  describe("Deposit and Withdraw", async function () {
  
    let reserveData;
    it("Deposit and Withdraw", async function () {
      
      reserveData = await lendPool.getReserveData(wETH.address);

      // console.log(reserveData);
      await wETH.mint(oneEther.mul(100));
      await wETH.approve(lendPool.address,oneEther.mul(100));
      // await wETH.approve(reserveData.mTokenAddresses[0],oneEther.mul(100));
      // await wETH.approve(reserveData.mTokenAddresses[1],oneEther.mul(100));
      // await wETH.approve(reserveData.mTokenAddresses[2],oneEther.mul(100));
      // await wETH.approve(reserveData.mTokenAddresses[3],oneEther.mul(100));

      for(let i = 0; i < reserveData.mTokenAddresses.length; i++){
        // instantiate mtoken proxy contract
        const proxy = burnLockMTokenImpl.attach(reserveData.mTokenAddresses[i]);
        // deposit
        await lendPool.deposit(wETH.address,oneEther.mul(i+1),owner.address,i,0);
        const deposited = await proxy.scaledBalanceOf(owner.address);
        // console.log("deposited",deposited.toString());
        expect(deposited).to.equal(oneEther.mul(i+1));
      }

      let liquidity = await wETH.balanceOf(lendPool.address);
      console.log("liquidity: "+liquidity);
      expect(liquidity).to.equal(oneEther.mul(10));

      reserveData = await lendPool.getReserveData(wETH.address);

      await ethers.provider.send("evm_increaseTime", [ONE_MONTH  * 14]);
      await ethers.provider.send("evm_mine");

      
      for(let i = 0; i < reserveData.mTokenAddresses.length; i++){
        await lendPool.withdraw(wETH.address,oneEther.mul(i+1),owner.address,i);
        const mTokenBalance = await burnLockMTokenImpl.attach(reserveData.mTokenAddresses[i]).scaledBalanceOf(owner.address);
        // console.log(mTokenBalance.toString());
        expect(mTokenBalance).to.equal(0);
      }
    })

    it("Interest calculation of Deposit, Borrow, Repay", async function () {

      //set nft oracle price to 2 ethers
      await mockNFTOracle.setAssets(nftAssets);
      await mockNFTOracle.setAssetData(mintableERC721.address, oneEther.mul(4));
      const nftPrice = await mockNFTOracle.getAssetPrice(mintableERC721.address);
      expect(nftPrice).to.equal(oneEther.mul(4));

      // set reserve asset price 1 ether
      const price = await mockReserveOracle.getAssetPrice(wETH.address);
      expect(price).to.equal(oneEther);

      reserveData = await lendPool.getReserveData(wETH.address);

      // mint ETH
      await wETH.mint(oneEther.mul(10000));
      await wETH.approve(lendPool.address,oneEther.mul(1000));
      await wETH.approve(reserveData.mTokenAddresses[0],oneEther.mul(1000));
      await wETH.approve(reserveData.mTokenAddresses[1],oneEther.mul(1000));
      await wETH.approve(reserveData.mTokenAddresses[2],oneEther.mul(1000));
      await wETH.approve(reserveData.mTokenAddresses[3],oneEther.mul(1000));

      // mint NFT
      await mintableERC721.mint(0);
      await mintableERC721.approve(lendPool.address, 0);

      // deposit
      await lendPool.deposit(wETH.address,oneEther.mul(1),owner.address,0,0);
      await lendPool.deposit(wETH.address,oneEther.mul(1),owner.address,1,0);
      await lendPool.deposit(wETH.address,oneEther.mul(1),owner.address,2,0);
      await lendPool.deposit(wETH.address,oneEther.mul(1),owner.address,3,0);
      //borrow
      await lendPool.borrow(wETH.address, oneEther.mul(2), mintableERC721.address, 0, owner.address,0 );

      reserveData = await lendPool.getReserveData(wETH.address);

      // console.log(reserveData);
      console.log("Current Liquidity Rate: " + reserveData[3]);
      console.log("Current Borrow Rate: " + reserveData[4]);

      const borrowRate = reserveData[4].mul(100).div(ray);
      expect(borrowRate).to.equal(16);

      for(let i = 0; i < reserveData.mTokenAddresses.length; i++){
        const liquidityRate = reserveData[3][i].mul(100).div(ray);
        console.log("Current Liquidity Rate of mToken"+i+": " + reserveData[3][i]);
        // expect(liquidityRate).to.equal(2* (i+1));
      }

      await lendPool.repay(mintableERC721.address, 0, oneEther.div(10000000));
      let balanceofNFT = await mintableERC721.balanceOf(owner.address);
      expect(balanceofNFT).to.equal(0);

      await lendPool.repay(mintableERC721.address, 0, oneEther.mul(5));
      balanceofNFT = await mintableERC721.balanceOf(owner.address);
      expect(balanceofNFT).to.equal(1);

    })

    it("Liquidate", async function () {
      // set nft oracle price to 2 ethers
      await mockNFTOracle.setAssets(nftAssets);
      await mockNFTOracle.setAssetData(mintableERC721.address, oneEther.mul(2));

      reserveData = await lendPool.getReserveData(wETH.address);

      // mint ETH and approve
      await wETH.mint(oneEther.mul(10));
      await wETH.connect(addr1).mint(oneEther.mul(10));

      await wETH.approve(lendPool.address,oneEther.mul(100));
      await wETH.approve(reserveData.mTokenAddresses[0],oneEther.mul(1000));
      await wETH.approve(reserveData.mTokenAddresses[1],oneEther.mul(1000));
      await wETH.approve(reserveData.mTokenAddresses[2],oneEther.mul(1000));
      await wETH.approve(reserveData.mTokenAddresses[3],oneEther.mul(1000));
      await wETH.connect(addr1).approve(lendPool.address,oneEther.mul(100));

      //mint NFT
      await mintableERC721.mint(0);
      await mintableERC721.approve(lendPool.address, 0);

      // deposit
      await lendPool.deposit(wETH.address,oneEther.mul(1),owner.address,0,0);
      await lendPool.deposit(wETH.address,oneEther.mul(1),owner.address,1,0);
      await lendPool.deposit(wETH.address,oneEther.mul(1),owner.address,2,0);
      await lendPool.deposit(wETH.address,oneEther.mul(1),owner.address,3,0);

      //borrow 50% of the collateral
      await lendPool.borrow(wETH.address, oneEther, mintableERC721.address, 0, owner.address,0 );

      let nftDebtData = await lendPool.getNftDebtData(mintableERC721.address, 0);
      let healthFactor = nftDebtData[5];
      expect(healthFactor).to.equal(oneEther);

      await ethers.provider.send("evm_increaseTime", [3600*24*365]);
      await ethers.provider.send("evm_mine");

      nftDebtData = await lendPool.getNftDebtData(mintableERC721.address, 0);
      healthFactor = nftDebtData[5];
      expect(healthFactor).lessThan(oneEther);

      // auction
      await lendPool.connect(addr1).auction(mintableERC721.address, 0, oneEther.mul(2), addr1.address);
      let auctionData = await lendPool.getNftAuctionData(mintableERC721.address, 0);
      let nftAuctionEndTime = await lendPool.getNftAuctionEndTime(mintableERC721.address, 0);

      await ethers.provider.send("evm_increaseTime", [3600*24*2]);
      await ethers.provider.send("evm_mine");

      await lendPool.liquidate(mintableERC721.address, 0, 0);
      const addr1NftBalance = await mintableERC721.balanceOf(addr1.address);
      expect(addr1NftBalance).to.equal(1);
    })


    it("Deposit and Withdraw via WETH Gateway", async function () {

      // set nft oracle price to 2 ethers
      await mockNFTOracle.setAssets(nftAssets);
      await mockNFTOracle.setAssetData(mintableERC721.address, oneEther.mul(10));

      const WETHGateway = await ethers.getContractFactory("WETHGateway");
      wETHGateway = await WETHGateway.deploy();
      await wETHGateway.deployed();

      await wETHGateway.initialize(lendPoolAddressesProvider.address, wETH.address);
      
      reserveData = await lendPool.getReserveData(wETH.address);

      // console.log(reserveData);
      await wETH.mint(oneEther.mul(100));
      // await wETH.approve(lendPool.address,oneEther.mul(100));
      // await wETH.approve(wETHGateway.address,oneEther.mul(100));

      await wETHGateway.depositETH(owner.address,0,0,{value:oneEther.mul(10)});
      await wETHGateway.connect(addr1).depositETH(addr1.address,0,0,{value:oneEther.mul(1)});

      const DebtTokenImpl = await ethers.getContractFactory("DebtToken");
      console.log("debtToken address"+reserveData.debtTokenAddress);
      const debtToken = DebtTokenImpl.attach(reserveData.debtTokenAddress);
      // approve delegation
      await debtToken.approveDelegation(wETHGateway.address,oneEther.mul(100));

      //borrow
      await mintableERC721.mint(0);
      await mintableERC721.approve(wETHGateway.address, 0);
      await wETHGateway.approveNFTTransfer(mintableERC721.address, true);

      await wETHGateway.borrowETH(oneEther.div(2),mintableERC721.address,0,owner.address,0,{gasLimit:1000000});

      const proxy = burnLockMTokenImpl.attach(reserveData.mTokenAddresses[0]);
    
      const deposited = await proxy.scaledBalanceOf(owner.address);
      // console.log("deposited",deposited.toString());
      expect(deposited).to.equal(oneEther);

      let liquidity = await wETH.balanceOf(lendPool.address);
      console.log("liquidity: "+liquidity);
      expect(liquidity).to.equal(oneEther.mul(2));
    
      //withdraw via gateway
      await ethers.provider.send("evm_increaseTime", [ONE_MONTH  * 14]);
      await ethers.provider.send("evm_mine");

      // await wETH.approve(wETHGateway.address,oneEther.mul(100));
      await proxy.approve(wETHGateway.address,oneEther.mul(100));

      await wETHGateway.withdrawETH(oneEther.mul(1),owner.address,0,{gasLimit: 10000000});
      const mTokenBalance = await burnLockMTokenImpl.attach(reserveData.mTokenAddresses[0]).scaledBalanceOf(owner.address);
      console.log(mTokenBalance.toString());
      expect(mTokenBalance).to.equal(0);
    })

    it("deploy new mToken and update", async function () {

      const WETHGateway = await ethers.getContractFactory("WETHGateway");
      wETHGateway = await WETHGateway.deploy();
      await wETHGateway.deployed();

      await wETHGateway.initialize(lendPoolAddressesProvider.address, wETH.address);
      
      reserveData = await lendPool.getReserveData(wETH.address);

      const BurnLockMTokenImpl = await ethers.getContractFactory("BurnLockMToken");
      burnLockMTokenImpl = await BurnLockMTokenImpl.deploy();
      await burnLockMTokenImpl.deployed();

      const UpdateMTokenInput = {
        asset: wETH.address,
        implementation: burnLockMTokenImpl.address,
        encodedCallData: "0x"
      }
      await lendPoolConfigurator.updateMToken([UpdateMTokenInput]);


    })

  })

})