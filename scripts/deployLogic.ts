import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain"
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain-types/contracts/libraries/logic"
async function main() {
  console.log("------start deploy -------");

  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  
  // Libraries
  let validationLogic: any;
  let supplyLogic: SupplyLogic;
  let borrowLogic: BorrowLogic;
  let liquidateLogic: LiquidateLogic;
  let reserveLogic: ReserveLogic;
  let nftLogic: any;
  let configuratorLogic: ConfiguratorLogic;


  [owner, addr1] = await ethers.getSigners();

  // Deploy and init needed contracts
  const ValidationLogic = await ethers.getContractFactory("ValidationLogic");
  validationLogic = await ValidationLogic.deploy();
  await validationLogic.deployed();
  


  const LiquidateLogic = await ethers.getContractFactory("LiquidateLogic", {libraries: {ValidationLogic: validationLogic.address}});
  liquidateLogic = await LiquidateLogic.deploy();
  await liquidateLogic.deployed();



  console.log("ValidationLogic deployed to:" + validationLogic.address);

  console.log("LiquidateLogic deployed to:" + liquidateLogic.address);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});