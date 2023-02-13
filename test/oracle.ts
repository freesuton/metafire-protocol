import { expect } from "chai";
import { ethers } from "hardhat";
import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';




describe("Lend Protocol", function () {
  console.log("------start test -------");
  const oneEther = ethers.BigNumber.from("1000000000000000000");
  const ray = ethers.BigNumber.from("1000000000000000000000000000");

  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ONE_GWEI = 1_000_000_000;

  let owner: any;
  let addr1: any;
  let addr2: any;

  let wETH: any;
  let mockMetaFireOracle: any;
  let mockNFTOracle: any;
  let mockReserveOracle: any;
  let mintableERC721: any;


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

})