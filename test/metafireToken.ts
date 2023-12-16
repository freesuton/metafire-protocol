const { expect } = require("chai");
const { ethers } = require("hardhat");
import { BurnLockMToken, WETH9Mocked, LendPoolAddressesProvider, LendPool } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { smock } from '@defi-wonderland/smock';

describe("MetaFire Token", function () {
  const ONE_MONTH = 3600 * 24 * 30;
  const ray = ethers.BigNumber.from(10).pow(27);
  const oneEther = ethers.BigNumber.from(10).pow(18);

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;


  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();


    const oneEther = ethers.utils.parseEther("1");

    

    // Deploy and init needed contracts

  });
  

  describe("Deployment", function () {
    // Write tests for the deployment and initialization of the contract
    it("Deploy Token", async function () {
        const MetaFireToken = await ethers.getContractFactory("MetaFireToken");
        const metaFireToken = await MetaFireToken.deploy();
        await metaFireToken.deployed();
    
        console.log("MetaFireToken deployed to:" + metaFireToken.address);
        await metaFireToken.initialize(owner.address, oneEther, {gasLimit: 10000000});
        // await metaFireToken.initialize(owner.address, oneEther, {gasLimit: 10000000});
    });



    it("Proxy pattern for token", async function () {
      const MetaFireToken = await ethers.getContractFactory("MetaFireToken");
      const metaFireToken = await MetaFireToken.deploy();
      await metaFireToken.deployed();

      /**
     * Deploy proxy contracts
     */
      const MetaFireProxyAdmin = await ethers.getContractFactory("MetaFireProxyAdmin");
      const metaFireProxyAdmin = await MetaFireProxyAdmin.deploy();
      await metaFireProxyAdmin.deployed();

      const MetaFireUpgradeableProxy = await ethers.getContractFactory("MetaFireUpgradeableProxy");

      const tokenProxy = await MetaFireUpgradeableProxy.deploy(metaFireToken.address, metaFireProxyAdmin.address, "0x");
      await tokenProxy.deployed();

      const tokenProxyAsMetaFireToken = await MetaFireToken.attach(tokenProxy.address);
      await tokenProxyAsMetaFireToken.initialize(owner.address, oneEther);

      const balance = await tokenProxyAsMetaFireToken.balanceOf(owner.address);

      expect(balance).to.equal(oneEther);
  });
  });



  describe("Vault Deployment", function () {
    // Write tests for the deployment and initialization of the contract
    it("Deploy Vault", async function () {

      //deploy address proovider
      const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
      const lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("ETH");
      await lendPoolAddressesProvider.deployed();
      // set an address as pool admin
      await lendPoolAddressesProvider.setPoolAdmin(owner.address);

      //deploy token
      const MetaFireToken = await ethers.getContractFactory("MetaFireToken");
      const metaFireToken = await MetaFireToken.deploy();
      await metaFireToken.deployed();

      await metaFireToken.initialize(owner.address, oneEther.mul(1000000));

      // check total supply
      const totalSupply = await metaFireToken.totalSupply();
      expect(totalSupply).to.equal(oneEther.mul(1000000));



      // deploy token vault
      const MetaFireTokenVault = await ethers.getContractFactory("MetaFireTokenVault");
      const metaFireTokenVault = await MetaFireTokenVault.deploy();
      await metaFireTokenVault.deployed();


      // give allooowance to vault
      await metaFireToken.approve(metaFireTokenVault.address, oneEther.mul(1000000));

      // lock 990 thousand tokens
      await metaFireTokenVault.initialize(lendPoolAddressesProvider.address, metaFireToken.address, oneEther.mul(990000));
      
      // check vault balance
      const balance = await metaFireToken.balanceOf(metaFireTokenVault.address);
      expect(balance).to.equal(oneEther.mul(990000));

      //Check if addresses other than the administrator can transfer tokens
      await expect(metaFireTokenVault.connect(addr1).transferLockedTokens(addr2.address, oneEther.mul(990000))).to.be.revertedWith("100");
      // check if admin can transfer tokens
      await metaFireTokenVault.transferLockedTokens(addr2.address, oneEther.mul(990000));
      // check if balance is 0
      const balanceAfterTransfer = await metaFireToken.balanceOf(metaFireTokenVault.address);
      expect(balanceAfterTransfer).to.equal(0);
      // check if addr2 has the tokens
      const balanceAddr2 = await metaFireToken.balanceOf(addr2.address);
      expect(balanceAddr2).to.equal(oneEther.mul(990000));

    });

  });



  // Add more describe blocks for other functions and edge cases
})
