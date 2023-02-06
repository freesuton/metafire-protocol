// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {Errors} from "../libraries/helpers/Errors.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {CountersUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";


/**
 * @title TokenLocking
 * @notice Lock token for 4 period time: 1 months, 3 months, 6months, 9months
 * @author MetaFire
 **/

contract TokenTimelock is Initializable, ContextUpgradeable{
  using SafeERC20Upgradeable for IERC20Upgradeable;
  using CountersUpgradeable for CountersUpgradeable.Counter;

  CountersUpgradeable.Counter private _loanIdTracker;

  // user -> mToken address -> LockingData
  mapping(address => mapping(address => LockingData)) _lockList;

  struct LockData{
    address locker;
    address asset;
    uint256 amount;
    uint256 releaseTime;
    uint256 id;
  }

  event Lock(
    address indexed user,
    address indexed asset,
    uint256 amount,
    uint256 releaseTime,
  )

  event unlock(
    address indexed user,
    address indexed asset,
    uint256 amount,
    uint256 unlockTime,
  )

    /**
   * @dev Prevents a contract from calling itself, directly or indirectly.
   * Calling a `nonReentrant` function from another `nonReentrant`
   * function is not supported. It is possible to prevent this from happening
   * by making the `nonReentrant` function external, and making it call a
   * `private` function that does the actual work.
   */
  modifier nonReentrant() {
    // On the first call to nonReentrant, _notEntered will be true
    require(_status != _ENTERED, "ReentrancyGuard: reentrant call");

    // Any calls to nonReentrant after this point will fail
    _status = _ENTERED;

    _;

    // By storing the original value once again, a refund is triggered (see
    // https://eips.ethereum.org/EIPS/eip-2200)
    _status = _NOT_ENTERED;
  }

  // called once by the factory at time of deployment
  function initialize(ILendPoolAddressesProvider provider) external initializer {
    __Context_init();

    _addressesProvider = provider;

    // Avoid having loanId = 0
    _loanIdTracker.increment();
  }

  function lock(
    address asset,
    uint256 amount,
    uint256 lockDuration,
    address onBehalfOf
  ) external nonReentrant {
    require(onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);
    require(asset != address(0), Errors.VL_INVALID_RESERVE_ADDRESS);

    LockData storage lockData = _lockList[onBehalfOf][asset];
    uint256 releaseTime = block.timestamp + lockDuration;

    // TODO add error type
    require(lockData.releaseTime < releaseTime, "Token has already been locked for longer time") ;

    IERC20Upgradeable(params.asset).safeTransferFrom(onBehalfOf, asset, amount);

    // Save Info
    lockData.locker = onBehalfOf;
    lockData.asset = asset;
    lockData.amount += amount;
    lockData.releaseTime = releaseTime;

    emit Lock(onBehalfOf, asset, amount, releaseTime);
  }

  function unlock(
    address asset,
    address onBehalfOf
  ) external nonReentrant {
    require(onBehalfOf != address(0), Errors.VL_INVALID_ONBEHALFOF_ADDRESS);
    require(asset != address(0), Errors.VL_INVALID_RESERVE_ADDRESS);

    LockData storage lockData = _lockList[onBehalfOf][asset];
    // TODO add error type
    require(lockData.releaseTime < block.timestamp, "Token has not been unlocked");
    uint256 balance = lockData.amount;
    lockData.amount = 0;
    IERC20Upgradeable(params.asset).safeTransferFrom(onBehalfOf, asset, balance);

    emit Unlock(onBehalfOf, asset, balance, block.timestamp);
  }

}
