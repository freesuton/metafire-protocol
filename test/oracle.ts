import { expect } from "chai";
import { ethers } from "hardhat";

import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721} from "../typechain-types/contracts/mock"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


describe("Mock Oracle", function () {
  console.log("------start test -------");
  const oneEther = ethers.BigNumber.from("1000000000000000000");
  const ray = ethers.BigNumber.from("1000000000000000000000000000");
  const oneEther8Decimals = ethers.BigNumber.from("100000000");
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ONE_GWEI = 1_000_000_000;

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  let wETH: WETH9Mocked;
  let mockMetaFireOracle: MockMetaFireOracle;
  let mockNFTOracle: MockNFTOracle;
  let mockReserveOracle: MockReserveOracle;
  let mintableERC721: MintableERC721;

  let nftOracleGetter: any;
  let mockDIAOracle: any;

  this.beforeEach(async () => {

    [owner, addr1] = await ethers.getSigners();
    
    const MintableERC721 = await ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");

    const WETH9Mocked = await ethers.getContractFactory("WETH9Mocked");
    wETH = await WETH9Mocked.deploy();

    const MockMetaFireOracle = await ethers.getContractFactory("MockMetaFireOracle");
    mockMetaFireOracle = await MockMetaFireOracle.deploy();

    const MockNFTOracle = await ethers.getContractFactory("MockNFTOracle");
    mockNFTOracle = await MockNFTOracle.deploy();
    await mockNFTOracle.initialize(owner.address,oneEther.div(10).mul(2),oneEther.div(10),30,10,600);

    const MockReserveOracle = await ethers.getContractFactory("MockReserveOracle");
    mockReserveOracle = await MockReserveOracle.deploy();
    await mockReserveOracle.initialize(wETH.address);

  })
    it("Set and get NFT floor price from MetaFire oracle", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const key: string = "ETH-" + mintableERC721.address;

      console.log(key);
      await mockMetaFireOracle.setValue(key, oneEther,oneEther,0,0,0,1674382846);
      const floorPrice = await  mockMetaFireOracle.getValue(key);
      expect(floorPrice[0]).to.equal(oneEther);
    })

    it("Set and get reserve asset price", async function () {
      const [owner, addr1] = await ethers.getSigners();

      const price = await mockReserveOracle.getAssetPrice(wETH.address);
      expect(price).to.equal(oneEther);

    })

    it("Set and get NFT floor price from NFT oracle", async function () {
      const [owner, addr1] = await ethers.getSigners();

      // setAssetData(address _nftContract, uint256 _price) setAssets
      const nftAssets = [mintableERC721.address]
      await mockNFTOracle.setAssets(nftAssets);
      await mockNFTOracle.setAssetData(mintableERC721.address, oneEther.mul(2));
      const price = await mockNFTOracle.getAssetPrice(mintableERC721.address);
      expect(price).to.equal(oneEther.mul(2));
    })

    it("Set and get NFT floor price from NFT oracle", async function () {
      const [owner, addr1] = await ethers.getSigners();

      // setAssetData(address _nftContract, uint256 _price) setAssets

      const nftAssets = [mintableERC721.address]

      const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
      const lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("eth");
      await lendPoolAddressesProvider.deployed();

      const MockDIAOracle = await ethers.getContractFactory("MockDIAOracle");
      mockDIAOracle = await MockDIAOracle.deploy();
      await mockDIAOracle.deployed();

      const AddressChecksumUtils = await ethers.getContractFactory("AddressChecksumUtils");
      const addressCheckSumUtils = await AddressChecksumUtils.deploy();
      await addressCheckSumUtils.deployed();

      const NFTOracleGetter = await ethers.getContractFactory("NFTOracleGetter",{libraries: {AddressChecksumUtils: addressCheckSumUtils.address}});
      nftOracleGetter = await NFTOracleGetter.deploy();

      await nftOracleGetter.initialize("ETH-", mockDIAOracle.address, lendPoolAddressesProvider.address);

      // Set NFT price
      const key: string = "ETH-" + mintableERC721.address;
      await mockDIAOracle.setValue(key, oneEther8Decimals,oneEther8Decimals,0,0,0,1674382846);
      const oPrice = await  mockDIAOracle.getValue(key);
      const floorPrice = await nftOracleGetter.getAssetPrice(mintableERC721.address);
      // expect(floorPrice).to.equal(oneEther);
      console.log("floorPrice",floorPrice.toString());
      expect(oPrice[0]).to.equal(oneEther8Decimals);

    })

})