// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {INFTOracleGetter} from "../interfaces/INFTOracleGetter.sol";
import {INFTOracle} from "../interfaces/INFTOracle.sol";
import {AddressChecksumUtils} from "../utils/AddressChecksumUtils.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {Errors} from "../libraries/helpers/Errors.sol";

contract NFTOracleGetterVii is INFTOracleGetter, Initializable {

    ILendPoolAddressesProvider internal _addressesProvider;
    INFTOracle internal _nftOracle;
    bool internal _enforcePriceCheck;

    modifier onlyPoolAdmin() {
        require(_addressesProvider.getPoolAdmin() == msg.sender, Errors.CALLER_NOT_POOL_ADMIN);
        _;
    }

    function initialize(ILendPoolAddressesProvider provider, address oracleAddress, bool enforcePriceCheck) public initializer {
        _addressesProvider = provider;
        _nftOracle = INFTOracle(oracleAddress);
        _enforcePriceCheck = enforcePriceCheck;
    }

    /* CAUTION: Price unit is ETH based (WEI, 18 decimals) */
    /***********

    /**
     * @dev Get NFT floor price from Oracle
     * @param asset of the NFT Oracle 
     */
    function getAssetPrice(address asset) override external view returns (uint256) {
        require(asset != address(0), "NFTOracleGetter: Oracle address is not set");

        uint256 nftFloorPrice = _nftOracle.getAssetPrice(asset);
        if (_enforcePriceCheck) {
            require(nftFloorPrice > 0, "NFTOracleGetter: NFT price is 0 or less than 0");
        }
        return nftFloorPrice;
    }

    function setEnforcePriceCheck(bool enforcePriceCheck) external onlyPoolAdmin {
        _enforcePriceCheck = enforcePriceCheck;
    }
}
