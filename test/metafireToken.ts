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
      console.log(oneEther);
      console.log(balance);

      expect(balance).to.equal(oneEther);
  });
  });






  // Add more describe blocks for other functions and edge cases
})
