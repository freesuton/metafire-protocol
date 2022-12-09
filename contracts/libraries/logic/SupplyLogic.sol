// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {Errors} from "../helpers/Errors.sol";
import {DataTypes} from '../protocol/libraries/types/DataTypes.sol';

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
library SupplyLogic {

    event Deposit(
        address user,
        address indexed reserve,
        uint256 amount,
        uint256 borrowRateMode,
        address indexed onBehalfOf,
        uint16 indexed referral
    );
    function executeDeposit(       
        mapping(address => DataTypes.ReserveData) storage reservesData,
        DataTypes.ExecuteDepositParams memory params
    ) external {
        require(params.onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);

        DataTypes.ReserveData storage reserve = reservesData[params.asset];
        
    }
}