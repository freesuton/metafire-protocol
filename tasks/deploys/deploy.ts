import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
require('dotenv').config();

task("mint-mock-nft", "Mint mock NFT for dev environment")
  .addParam("address", "The Ethereum address to check")
  .setAction(async ({ address }, hre) => {
    const [owner, addr1] = await hre.ethers.getSigners();
    const mintableERC721Address: string = process.env.MINTABLE_ERC721_ADDRESS || "";

    const MintableERC721 = await hre.ethers.getContractFactory("MintableERC721");
    const mintableERC721 = await MintableERC721.attach(mintableERC721Address);

    console.log(mintableERC721Address);
    const tx = await mintableERC721.mint(2);
    console.log("Minted NFT with tx hash: ", tx.hash);
});
