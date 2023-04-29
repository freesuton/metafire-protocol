import { expect } from "chai";
import { ethers } from "hardhat";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721} from "../typechain-types/contracts/mock";
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain-types/contracts/libraries/logic"
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate,MToken, DebtToken} from "../typechain-types/contracts/protocol"
import {MetaFireProxyAdmin, MetaFireUpgradeableProxy} from "../typechain-types/contracts/libraries/proxy";
import { FakeContract, smock } from '@defi-wonderland/smock';

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


  this.beforeEach(async () => {

    [owner, addr1] = await ethers.getSigners();

    const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");

    const InterestRate = await ethers.getContractFactory("InterestRate");
    // U: 65%, BR:10%, S1: 8%, d2: 100%
    // distributeCoefficients_： 2:3:4:5
    const distributeCoefficients= [ray,ray,ray.mul(2),ray.mul(2)];
    interestRate = await InterestRate.deploy(lendPoolAddressesProvider.address,ray.div(100).mul(65),ray.div(10),ray.div(100).mul(8),ray, distributeCoefficients);

  })
   
  describe("Interest Rate", async function () {
  
    it("Configuration", async function () {
      
        const coefficients = await interestRate.getDistributeCoefficients();
        console.log(coefficients);
        expect(coefficients[0]).to.equal(ray);
        expect(coefficients[1]).to.equal(ray);
        expect(coefficients[2]).to.equal(ray.mul(2));
        expect(coefficients[3]).to.equal(ray.mul(2));

    })

    it("Calculation", async function () {

      const fakeMToken = await smock.fake('BurnLockMToken');
      fakeMToken.scaledTotalSupply.returns(oneEther.mul(10));

      const x = await fakeMToken.scaledTotalSupply();
      console.log("sdsdsds"+x);
      console.log(fakeMToken.address);
    })
})

})