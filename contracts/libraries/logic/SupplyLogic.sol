// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {IMToken} from "../../interfaces/IMToken.sol";

import {Errors} from "../helpers/Errors.sol";
import {DataTypes} from '../protocol/libraries/types/DataTypes.sol';

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import {ReserveLogic} from "./ReserveLogic.sol";
import {ValidationLogic} from "./ValidationLogic.sol";

library SupplyLogic {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using ReserveLogic for DataTypes.ReserveData;

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
    function executeDeposit(       
        mapping(address => DataTypes.ReserveData) storage reservesData,
        DataTypes.ExecuteDepositParams memory params
    ) external {
        require(params.onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);

        DataTypes.ReserveData storage reserve = reservesData[params.asset];
        address mToken = reserve.mTokenAddress;
        require(mToken != address(0), Errors.VL_INVALID_RESERVE_ADDRESS);

        ValidationLogic.validateDeposit(reserve, params.amount);

        reserve.updateState();
        reserve.updateInterestRates(params.asset, mToken, params.amount, 0);

        IERC20Upgradeable(params.asset).safeTransferFrom(params.initiator, mToken, params.amount);

        IBToken(bToken).mint(params.onBehalfOf, params.amount, reserve.liquidityIndex);

        emit Deposit(params.initiator, params.asset, params.amount, params.onBehalfOf, params.referralCode);
    }
}