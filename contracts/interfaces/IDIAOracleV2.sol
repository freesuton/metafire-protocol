// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;
interface IDIAOracleV2{
    function getValue(string memory) external returns (uint128, uint128);
}