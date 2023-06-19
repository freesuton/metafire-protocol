import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain-types/contracts/libraries/logic"
async function main() {
  console.log("------start deploy -------");

  const oneEther = ethers.utils.parseEther("1");
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  
  // Libraries
  let metaFireERC721: any;




  [owner, addr1] = await ethers.getSigners();

  // Deploy and init needed contracts
  
  const MetaFireERC721 = await ethers.getContractFactory("MetaFireERC721");
  metaFireERC721 = await metaFireERC721.deploy("MF","METAFIRE", oneEther.div(100),"https://ipfs.io/ipfs/QmdSgXVpWVwcyU9r5goNqbWZZmXPjGkmZG3bzkmARHrid8/");
  await metaFireERC721.deployed();

  await metaFireERC721.mint({value:oneEther.div(100)});

  console.log("MetaFireERC721 deployed to:" + metaFireERC721.address);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});