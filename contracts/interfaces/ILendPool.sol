// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {ILendPoolAddressesProvider} from "./ILendPoolAddressesProvider.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
interface ILendPool {

    /**
    * @dev Emitted on deposit()
    * @param user The address initiating the deposit
    * @param amount The amount deposited
    * @param reserve The address of the underlying asset of the reserve
    * @param onBehalfOf The beneficiary of the deposit, receiving the bTokens
    * @param referral The referral code used
    **/
    event Deposit(
    address user,
    address indexed reserve,
    uint256 amount,
    uint256 borrowRateMode,
    address indexed onBehalfOf,
    uint16 indexed referral
    );

    function deposit(
        address reserve,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf,
        uint16 referralCode
    ) external;
}