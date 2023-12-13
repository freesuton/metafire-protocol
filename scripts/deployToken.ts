import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function main() {
    console.log("------start deploy -------");

    const oneEther = ethers.utils.parseEther("1");
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    
    // Libraries
    //   let metaFireERC721: any;




    [owner, addr1] = await ethers.getSigners();

    // Deploy and init needed contracts
    
    const MetaFireToken = await ethers.getContractFactory("MetaFireToken");
    const metaFireToken = await MetaFireToken.deploy();
    await metaFireToken.deployed();

    console.log("MetaFireToken deployed to:" + metaFireToken.address);
    await metaFireToken.initialize(owner.address, oneEther);



}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});