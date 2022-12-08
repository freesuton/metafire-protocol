// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {ILendPool} from "../interfaces/ILendPool.sol";

import {Errors} from "../libraries/helpers/Errors.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {SupplyLogic} from "../libraries/logic/SupplyLogic.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract LendPool is ContextUpgradeable, ReentrancyGuard{

    function deposit(
        address asset,
        uint256 amount,
        uint256 interestRateMode,
        address onBehalfOf,
        uint16 referralCode
    ) external {
        SupplyLogic.executeDeposit(
            _reserves,
            DataTypes.ExecuteDepositParams({
            initiator: _msgSender(),
            asset: asset,
            amount: amount,
            interestRateMode: interestRateMode,
            onBehalfOf: onBehalfOf,
            referralCode: referralCode
            })
        );
    }
}