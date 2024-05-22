// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {INFTOracleGetter} from "../interfaces/INFTOracleGetter.sol";
import {INFTOracle} from "../interfaces/INFTOracle.sol";
import {AddressChecksumUtils} from "../utils/AddressChecksumUtils.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {Errors} from "../libraries/helpers/Errors.sol";

contract NFTLinkOracleGetter is INFTOracleGetter, Initializable{

    ILendPoolAddressesProvider internal _addressesProvider;

    // NFT Address => Chainlink Oracle Address
    address _oracleAddresses;

    modifier onlyPoolAdmin() {
        require(_addressesProvider.getPoolAdmin() == msg.sender, Errors.CALLER_NOT_POOL_ADMIN);
        _;
    }

    function initialize(ILendPoolAddressesProvider provider) public initializer {
        _addressesProvider = provider;
    }

    /* CAUTION: Price uint is ETH based (WEI, 18 decimals) */
    /***********

    /**
     * @dev Get NFT floor price from Oralce
     * @param asset of the NFT Oralce
     */
    function getAssetPrice( address asset) override external view returns ( uint256 ){
        // address oracleAddress = _oracleAddresses[asset];
        require( oracleAddress != address(0), "NFTOracleGetter: Oracle address is not set");
  
        uint256 nftFloorPrice = INFTOracle( oracleAddress ).getAssetPrice();

        require(nftFloorPrice > 0, "NFTOracleGetter: NFT price is 0 or less than 0");
        return uint256(nftFloorPrice);
    }

    function setOracle(address asset, address oracleAddress) external onlyPoolAdmin {
        _oracleAddresses = oracleAddress;
    }
}