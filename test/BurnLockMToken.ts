const { expect } = require("chai");
const { ethers } = require("hardhat");
import { BurnLockMToken, WETH9Mocked, LendPoolAddressesProvider,MToken } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("BurnLockMToken", function () {
  const ONE_MONTH = 3600 * 24 * 30;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  let metaFireUpgradeableProxy: any;
  let metaFireProxyAdmin: any;
  let attachedBurnTokenProxy: BurnLockMToken;

  let lendPoolAddressesProvider: LendPoolAddressesProvider;
  let burnLockMToken: MToken;
  let wETH: WETH9Mocked;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const WETH9Mocked = await ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();
  
    const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
    lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("esth");
  
    // Deploy Implementation
    const BurnLockMToken = await ethers.getContractFactory("MToken");
    burnLockMToken = await BurnLockMToken.deploy();


    // Deploy Proxy
    const MetaFireProxyAdmin = await ethers.getContractFactory("MetaFireProxyAdmin");
    metaFireProxyAdmin = await MetaFireProxyAdmin.deploy();

    const MetaFireUpgradeableProxy = await ethers.getContractFactory("MetaFireUpgradeableProxy");
    const burnTokenProxy = await MetaFireUpgradeableProxy.deploy(burnLockMToken.address,metaFireProxyAdmin.address,"0x");

    // Attach Contract ABI to Proxy Address
    const attachedBurnTokenProxy = await burnLockMToken.attach(burnTokenProxy.address);

    await attachedBurnTokenProxy.initialize(
        lendPoolAddressesProvider.address,
        owner.address,
        wETH.address,
        18,
        "BurnLockMToken",
        "BLMT",
      );
  });
  

  describe("Deployment", function () {
    // Write tests for the deployment and initialization of the contract
    it("Should mint tokens to the user", async function () {
      console.log("owner.address");

    });
  });

  describe("Minting", function () {

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
