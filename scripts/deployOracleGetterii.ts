import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain"
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain-types/contracts/libraries/logic"
async function main() {
    console.log("------start deploy -------");

    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;

    const ADDRESS_PROVIDER = "0x873d7670e17C98462bF022e58BEE0e6bdef7E784";
    const ORACLE_ADDRESS = "0x7C2A19e54e48718f6C60908a9Cff3396E4Ea1eBA";


    [owner, addr1] = await ethers.getSigners();

    // Deploy and init needed contracts
    const NFTOracleGetterVii = await ethers.getContractFactory("NFTOracleGetterVii");
    const nftOracleGetterVii = await NFTOracleGetterVii.deploy();
    await nftOracleGetterVii.deployed();
  

    await nftOracleGetterVii.initialize(ADDRESS_PROVIDER, ORACLE_ADDRESS, false);

  console.log("NFTOracleGetterVii deployed to:" + nftOracleGetterVii.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});