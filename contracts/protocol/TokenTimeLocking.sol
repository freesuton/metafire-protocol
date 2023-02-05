// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

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
  mapping(address => mapping(address => LockingData)) stakingLists;

  struct LockingData{
    address staker;
    address mTokenAddress;
    uint256 mTokenAmount;
    uint256 releaseTime;
    uint256 id;
  }
  // called once by the factory at time of deployment
  function initialize(ILendPoolAddressesProvider provider) external initializer {
    __Context_init();

    _addressesProvider = provider;

    // Avoid having loanId = 0
    _loanIdTracker.increment();
  }


    // // ERC20 basic token contract being held
    // IERC20Upgradeable private immutable _token;

    // // beneficiary of tokens after they are released
    // address private immutable _beneficiary;

    // // timestamp when token release is enabled
    // uint256 private immutable _releaseTime;

    // /**
    //  * @dev Deploys a timelock instance that is able to hold the token specified, and will only release it to
    //  * `beneficiary_` when {release} is invoked after `releaseTime_`. The release time is specified as a Unix timestamp
    //  * (in seconds).
    //  */
    // constructor(IERC20 token_, address beneficiary_, uint256 releaseTime_) {
    //     require(releaseTime_ > block.timestamp, "TokenTimelock: release time is before current time");
    //     _token = token_;
    //     _beneficiary = beneficiary_;
    //     _releaseTime = releaseTime_;
    // }

    // /**
    //  * @dev Returns the token being held.
    //  */
    // function token() public view virtual returns (IERC20) {
    //     return _token;
    // }

    // /**
    //  * @dev Returns the beneficiary that will receive the tokens.
    //  */
    // function beneficiary() public view virtual returns (address) {
    //     return _beneficiary;
    // }

    // /**
    //  * @dev Returns the time when the tokens are released in seconds since Unix epoch (i.e. Unix timestamp).
    //  */
    // function releaseTime() public view virtual returns (uint256) {
    //     return _releaseTime;
    // }

    // /**
    //  * @dev Transfers tokens held by the timelock to the beneficiary. Will only succeed if invoked after the release
    //  * time.
    //  */
    // function release() public virtual {
    //     require(block.timestamp >= releaseTime(), "TokenTimelock: current time is before release time");

    //     uint256 amount = token().balanceOf(address(this));
    //     require(amount > 0, "TokenTimelock: no tokens to release");

    //     token().safeTransfer(beneficiary(), amount);
    // }
}