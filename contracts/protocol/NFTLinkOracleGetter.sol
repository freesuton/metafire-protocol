// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {INFTOracleGetter} from "../interfaces/INFTOracleGetter.sol";
import {IDIAOracle} from "../interfaces/IDIAOracle.sol";
import {AddressChecksumUtils} from "../utils/AddressChecksumUtils.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


contract NFTLinkOracleGetter is INFTOracleGetter, Initializable{

    ILendPoolAddressesProvider internal _addressesProvider;

    // NFT Address => Chainlink Oracle Address
    mapping(address => address) internal _oracleAddresses;
    AggregatorV3Interface internal nftFloorPriceFeed;

    function initialize(ILendPoolAddressesProvider provider) public initializer {
        _addressesProvider = provider;
    }

    /* CAUTION: Price uint is ETH based (WEI, 18 decimals) */
    /***********

    /**
     * @dev Get NFT floor price from Chainlink Oralce
     * @param asset of the NFT Oralce
     */
    function getAssetPrice( address asset) override external view returns ( uint256 ){
        (
            /*uint80 roundID*/,
            int nftFloorPrice,
            /*uint startedAt*/,
            /*uint timeStamp*/,
            /*uint80 answeredInRound*/
        ) = AggregatorV3Interface( asset).latestRoundData();
        require(nftFloorPrice > 0, "NFTOracleGetter: NFT price is 0 or less than 0");
        return uint256(nftFloorPrice);
    }
}