import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const fs = require('fs');

async function main() {
    console.log("------start deploy -------");

    const oneEther = ethers.BigNumber.from(10).pow(18);
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    

    [owner, addr1] = await ethers.getSigners();


    // read admin address from json file
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);

    const ADDRESS_PROVIDER_ADDRESS = jsonData.lendPoolAddressesProviderAddress;
    const METAFIRE_TOKEN_ADDRESS = jsonData.MetaFireTokenProxy;

    //get token contract:
    const MetaFireToken = await ethers.getContractFactory("MetaFireToken");
    const metaFireToken = await MetaFireToken.attach(METAFIRE_TOKEN_ADDRESS);

    // deploy token vault
    const MetaFireTokenVault = await ethers.getContractFactory("MetaFireTokenVault");
    const metaFireTokenVault = await MetaFireTokenVault.deploy();
    await metaFireTokenVault.deployed();

    // give allooowance to vault
    await metaFireToken.approve(metaFireTokenVault.address, oneEther.mul(1000000));

    // lock 990 thousand tokens
    await metaFireTokenVault.initialize(ADDRESS_PROVIDER_ADDRESS, METAFIRE_TOKEN_ADDRESS, oneEther.mul(990000));
  

}


function loadJsonFile(filename: string) {
  const data = fs.readFileSync(filename, 'utf-8');
  return JSON.parse(data);
}

function saveJsonFile(filename:string, data:any) {
  const jsonString = JSON.stringify(data, null, 2);
  fs.writeFileSync(filename, jsonString, 'utf-8');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});