const { expect } = require("chai");
const { ethers } = require("hardhat");
import { BurnLockMToken, WETH9Mocked, LendPoolAddressesProvider,MToken, LendPool } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("BurnLockMToken", function () {
  const ONE_MONTH = 3600 * 24 * 30;
  const ray = ethers.BigNumber.from(10).pow(27);

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  let metaFireUpgradeableProxy: any;
  let metaFireProxyAdmin: any;
  let attachedBurnTokenProxy: BurnLockMToken;
  let aLendPoolProxy: BurnLockMToken

  let lendPool: LendPool;
  let lendPoolAddressesProvider: LendPoolAddressesProvider;
  let burnLockMToken: BurnLockMToken;
  let wETH: WETH9Mocked;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const WETH9Mocked = await ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();
  
    const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("esth");
  
    // Deploy Lend Pool
    // const LendPool = await ethers.getContractFactory("LendPool");
    // lendPool = await LendPool.deploy(lendPoolAddressesProvider.address);

    // Mock Lend Pool
    await lendPoolAddressesProvider.setAddress(ethers.utils.formatBytes32String("LEND_POOL"), owner.address)

    // Deploy Implementation
    const BurnLockMToken = await ethers.getContractFactory("BurnLockMToken");
    burnLockMToken = await BurnLockMToken.deploy();


    // Deploy Proxy
    const MetaFireProxyAdmin = await ethers.getContractFactory("MetaFireProxyAdmin");
    metaFireProxyAdmin = await MetaFireProxyAdmin.deploy();

    const MetaFireUpgradeableProxy = await ethers.getContractFactory("MetaFireUpgradeableProxy");
    const burnTokenProxy = await MetaFireUpgradeableProxy.deploy(burnLockMToken.address,metaFireProxyAdmin.address,"0x");

    // Attach Contract ABI to Proxy Address
    attachedBurnTokenProxy = await burnLockMToken.attach(burnTokenProxy.address);

    await attachedBurnTokenProxy.initialize(
        lendPoolAddressesProvider.address,
        owner.address,
        wETH.address,
        18,
        "BurnLockMToken",
        "BLMT",
        ONE_MONTH
    );

  });
  

  describe("Deployment", function () {
    // Write tests for the deployment and initialization of the contract
    it("Should mint tokens to the user", async function () {
      expect(await attachedBurnTokenProxy.RESERVE_TREASURY_ADDRESS()).to.equal(owner.address);
      expect(await attachedBurnTokenProxy.UNDERLYING_ASSET_ADDRESS()).to.equal(wETH.address);
      expect(await attachedBurnTokenProxy.POOL()).to.equal(owner.address);
      expect(await attachedBurnTokenProxy.LOCK_PERIOD()).to.equal(ONE_MONTH);
    });
  });

  describe("Minting", function () {
    it("Should mint tokens to the user", async function () {
      // Round up
      await attachedBurnTokenProxy.mint(owner.address, 100, ray.mul(11).div(10));
      const balanceOf = await attachedBurnTokenProxy.scaledBalanceOf(owner.address);
      console.log("balance"+balanceOf.toString());
      expect(await attachedBurnTokenProxy.scaledBalanceOf(owner.address)).to.equal(Math.ceil(100 / 1.1));

      // ROund down
      await attachedBurnTokenProxy.mint(addr1.address, 120, ray.mul(11).div(10));
      expect(await attachedBurnTokenProxy.scaledBalanceOf(addr1.address)).to.equal(Math.floor(120 / 1.1));
    })
  });

  describe("Burning", function () {
    // Write tests for the burn() function
  });

  describe("Transfers", function () {
    // Write tests for the transfer() and transferFrom() functions
  });

  describe("Balances", function () {
    // Write tests for balanceOf(), scaledBalanceOf(), and totalSupply() functions
  });

  // Add more describe blocks for other functions and edge cases
})
