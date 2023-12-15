import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const fs = require('fs');

async function main() {
    console.log("------start deploy -------");

    const oneEther = ethers.utils.parseEther("1");
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    

    [owner, addr1] = await ethers.getSigners();


    // Deploy token contract logic
    const MetaFireToken = await ethers.getContractFactory("MetaFireToken");
    const metaFireToken = await MetaFireToken.deploy();
    await metaFireToken.deployed();

    // read admin address from json file
    const path = './tasks/deploys/mainnetContractAddresses.json';
    const jsonData = loadJsonFile(path);
    const adminAddress = jsonData.metaFireProxyAdminAddress;

    // deploy token proxy
    const MetaFireUpgradeableProxy = await ethers.getContractFactory("MetaFireUpgradeableProxy");
    const tokenProxy = await MetaFireUpgradeableProxy.deploy(metaFireToken.address, adminAddress, "0x");
    await tokenProxy.deployed();

    // initialize token proxy
    const tokenProxyAsMetaFireToken = await MetaFireToken.attach(tokenProxy.address);
    await tokenProxyAsMetaFireToken.initialize(owner.address, oneEther.mul(1000000));

    console.log("MetaFireToken deployed to:" + metaFireToken.address);
    console.log("MetaFireTokenProxy deployed to:" + tokenProxy.address);



    // console.log("MetaFireToken deployed to:" + metaFireToken.address);
    // await metaFireToken.initialize(owner.address, oneEther);

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