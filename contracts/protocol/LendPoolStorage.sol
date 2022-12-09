// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {DataTypes} from "../libraries/types/DataTypes.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";

contract LendPoolStorage {
    mapping(address => DataTypes.ReserveData) internal _reserves;
    mapping(address => DataTypes.NftData) internal _nfts;
}