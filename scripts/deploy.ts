import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {SupplyLogic,BorrowLogic, LiquidateLogic, ReserveLogic,ConfiguratorLogic} from "../typechain-types/contracts/libraries/logic"
import {LendPool,LendPoolLoan,LendPoolConfigurator,LendPoolAddressesProvider, InterestRate,MToken, DebtToken} from "../typechain-types/contracts/protocol"
import {MetaFireProxyAdmin, MetaFireUpgradeableProxy} from "../typechain-types/contracts/libraries/proxy";
import {WETH9Mocked,MockMetaFireOracle, MockNFTOracle, MockReserveOracle, MintableERC721} from "../typechain-types/contracts/mock";

async function main() {
  const ray = ethers.BigNumber.from("1000000000000000000000000000");
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  let erc20Assets: any;
  let nftAssets: any;
  
  // Libraries
  let validationLogic: any;
  let supplyLogic: SupplyLogic;
  let borrowLogic: BorrowLogic;
  let liquidateLogic: LiquidateLogic;
  let reserveLogic: ReserveLogic;
  let nftLogic: any;
  let configuratorLogic: ConfiguratorLogic;

  // Contracts; 'a' means "attached"
  let metaFireProxyAdmin: MetaFireProxyAdmin;
  let metaFireUpgradeableProxy: MetaFireUpgradeableProxy;

  let aLendPoolProxy: LendPool;
  let aLendPoolLoanProxy: LendPoolLoan;
  let aLendPoolConfiguratorProxy: LendPoolConfigurator;
  let aLendPoolAddressesProviderProxy: LendPoolAddressesProvider;

  let aBNFTRegistryProxy: any;
  let aMockNFTOracleProxy: MockNFTOracle;
  let aMockReserveOracleProxy: MockReserveOracle;

  let aDebtTokenProxy: DebtToken;
  let aMTokenProxy: MToken;
  
  let lendPool: LendPool;
  let lendPoolLoan: LendPoolLoan;
  let lendPoolConfigurator: LendPoolConfigurator;
  let lendPoolAddressesProvider: LendPoolAddressesProvider;
  let interestRate: InterestRate;
  let wETH: WETH9Mocked;
  let mToken: MToken;
  let debtToken: DebtToken;
  let mintableERC721: MintableERC721;
  let bNFT: any;
  let bNFTRegistry: any;
  let mockNFTOracle: MockNFTOracle;
  let mockReserveOracle: MockReserveOracle;

  [owner, addr1] = await ethers.getSigners();

  // Deploy and init needed contracts
  const ValidationLogic = await ethers.getContractFactory("ValidationLogic");
  validationLogic = await ValidationLogic.deploy();
  
  const SupplyLogic = await ethers.getContractFactory("SupplyLogic", {libraries: {ValidationLogic: validationLogic.address }});
  supplyLogic = await SupplyLogic.deploy();

  const BorrowLogic = await ethers.getContractFactory("BorrowLogic", {libraries: {ValidationLogic: validationLogic.address}});
  borrowLogic = await BorrowLogic.deploy();

  const LiquidateLogic = await ethers.getContractFactory("LiquidateLogic", {libraries: {ValidationLogic: validationLogic.address}});
  liquidateLogic = await LiquidateLogic.deploy();

  const ReserveLogic = await ethers.getContractFactory("ReserveLogic");
  reserveLogic = await ReserveLogic.deploy();
  
  const NftLogic = await ethers.getContractFactory("NftLogic");
  nftLogic = await NftLogic.deploy();

  const ConfiguratorLogic = await ethers.getContractFactory("ConfiguratorLogic");
  configuratorLogic = await ConfiguratorLogic.deploy();

  const LendPoolAddressesProvider = await ethers.getContractFactory("LendPoolAddressesProvider");
  lendPoolAddressesProvider = await LendPoolAddressesProvider.deploy("GenesisMarket");

  /*
    Deploy implementation contracts 
  */ 
  const LendPool = await ethers.getContractFactory("LendPool", {
    libraries: {
      SupplyLogic: supplyLogic.address,
      BorrowLogic: borrowLogic.address,
      LiquidateLogic: liquidateLogic.address,
      ReserveLogic: reserveLogic.address,
      NftLogic: nftLogic.address
    },
  });
  lendPool = await LendPool.deploy();

  const LendPoolLoan = await ethers.getContractFactory("LendPoolLoan");
  lendPoolLoan = await LendPoolLoan.deploy();

  const LendPoolConfigurator = await ethers.getContractFactory("LendPoolConfigurator", {
    libraries: {
      ConfiguratorLogic: configuratorLogic.address,
    },
  });
  lendPoolConfigurator = await LendPoolConfigurator.deploy();



}


// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
