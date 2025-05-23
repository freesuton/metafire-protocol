// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {INFTOracleGetter} from "../interfaces/INFTOracleGetter.sol";
import {IDIAOracle} from "../interfaces/IDIAOracle.sol";
import {AddressChecksumUtils} from "../utils/AddressChecksumUtils.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


contract NFTOracleGetter is INFTOracleGetter, Initializable{

    ILendPoolAddressesProvider internal _addressesProvider;
    IDIAOracle internal _diaOracle;
    string private CHAIN_NAME;
    AggregatorV3Interface internal nftFloorPriceFeed;

    function initialize(string memory chainName_, IDIAOracle oracle ,ILendPoolAddressesProvider provider) public initializer {
        _addressesProvider = provider;
        _diaOracle = oracle;
        CHAIN_NAME = chainName_;
    }

    /* CAUTION: Price uint is ETH based (WEI, 18 decimals) */
    /***********
    @dev returns the asset price in ETH from DIA oracle
    */
    function getAssetPrice( address asset) override external view returns (uint256){

        string memory key = getKey(asset);

        (uint64 value0,,,,,) = _diaOracle.getValue(key);
        uint256 convertedValue = uint256(value0) * 10**10;
        return convertedValue;
    }
    

    function getChainName() public view returns (string memory) {
        return CHAIN_NAME;
    }

    function getKey(address asset) public view returns (string memory) {
        string memory checksumAddr = AddressChecksumUtils.getChecksum(asset);
        string memory key = concatStrings(CHAIN_NAME, "0x", checksumAddr);
        return key;
    }

    // concat string
    function concatStrings(string memory a, string memory b, string memory c) public pure returns (string memory) {
        bytes memory bytesA = bytes(a);
        bytes memory bytesB = bytes(b);
        bytes memory bytesC = bytes(c);
        
        bytes memory result = new bytes(bytesA.length + bytesB.length + bytesC.length);
        
        uint256 k = 0;
        
        for (uint256 i = 0; i < bytesA.length; i++) {
            result[k++] = bytesA[i];
        }
        
        for (uint256 i = 0; i < bytesB.length; i++) {
            result[k++] = bytesB[i];
        }
        
        for (uint256 i = 0; i < bytesC.length; i++) {
            result[k++] = bytesC[i];
        }
        
        return string(result);
    }
}