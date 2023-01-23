// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IIncentivesController} from "../interfaces/IDIARacleV2.sol";

contract MockDIAOracle{
    struct Values {
        uint256 value0;
        uint256 value1;
    }
    mapping (string => Values) public values;
    address oracleUpdater;
    function getValue(string memory key) external view returns (uint64, uint64, uint64, uint64, uint64, uint64) {
        Values storage cStruct = values[key];
        uint64 rValue0 = (uint64)(cStruct.value0 >> 192);
        uint64 rValue1 = (uint64)((cStruct.value0 >> 128) % 2**64);
        uint64 rValue2 = (uint64)((cStruct.value0 >> 64) % 2**64);
        uint64 rValue3 = (uint64)(cStruct.value1 >> 192);
        uint64 rValue4 = (uint64)((cStruct.value1 >> 128) % 2**64);
        uint64 timestamp = (uint64)((cStruct.value1 >> 64) % 2**64);
        return (rValue0, rValue1, rValue2, rValue3, rValue4, timestamp);
    }
}