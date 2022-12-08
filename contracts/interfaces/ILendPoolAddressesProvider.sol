// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;
interface ILendPoolAddressesProvider {
    function getAddress(bytes32 id) external view returns (address);

    function getLendPool() external view returns (address);
}