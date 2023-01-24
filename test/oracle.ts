import { expect } from "chai";
import { ethers } from "hardhat";

describe("Lend Protocol", function () {
  console.log("------start test -------");
  const oneEther = ethers.BigNumber.from("1000000000000000000");
  const ray = ethers.BigNumber.from("1000000000000000000000000000");

  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const ONE_GWEI = 1_000_000_000;

  let mockMetaFireOracle: any;
  let mintableERC721: any;


  this.beforeEach(async () => {
    
    const MintableERC721 = await ethers.getContractFactory("MintableERC721");
    mintableERC721 = await MintableERC721.deploy("mNFT","MNFT");

    const MockMetaFireOracle = await ethers.getContractFactory("MockMetaFireOracle");
    mockMetaFireOracle = await MockMetaFireOracle.deploy();

  })
    it("Set and get NFT floor price from oracle", async function () {
      const [owner, addr1] = await ethers.getSigners();
      const key: string = "ETH-" + mintableERC721.address;
      console.log(key);
      await mockMetaFireOracle.setValue(key, oneEther,oneEther,0,0,0,1674382846);
      const floorPrice = await  mockMetaFireOracle.getValue(key);
      expect(floorPrice[0]).to.equal(oneEther);
    })
})