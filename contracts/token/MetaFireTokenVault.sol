// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";


import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Errors} from "../libraries/helpers/Errors.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";

contract MetaFireTokenVault is Initializable, OwnableUpgradeable {
    IERC20Upgradeable private _token;
    uint256 private _lockedAmount;

    ILendPoolAddressesProvider internal _addressProvider;

    modifier onlyLendPool() {
        require(_msgSender() == address(_getLendPool()), Errors.CT_CALLER_MUST_BE_LEND_POOL);
        _;
    }

    function initialize(ILendPoolAddressesProvider addressProvider,address tokenAddress, uint256 initialLockAmount) public initializer {
        require(tokenAddress != address(0), "Token address cannot be zero address");
        _addressProvider = addressProvider;
        _token = IERC20Upgradeable(tokenAddress);
        lockTokens(initialLockAmount);
    }

    // Lock tokens in the vault
    function lockTokens(uint256 amount) public {
        require(amount > 0, "Amount must be greater than 0");
        uint256 balance = _token.balanceOf(address(this));
        // require(balance + amount <= _token.totalSupply() * 99 / 100, "Cannot lock more than 99% of tokens");

        _lockedAmount += amount;
        bool sent = _token.transferFrom(msg.sender, address(this), amount);
        require(sent, "Token transfer failed");
    }

    // Allow the admin to transfer locked tokens
    function transferLockedTokens(address to, uint256 amount) public onlyLendPool {
        require(amount <= _lockedAmount, "Insufficient locked tokens");
        _lockedAmount -= amount;
        bool sent = _token.transfer(to, amount);
        require(sent, "Token transfer failed");
    }

    // Check the amount of locked tokens
    function lockedTokens() public view returns (uint256) {
        return _lockedAmount;
    }

    function _getLendPool() internal view returns (ILendPool) {
        return ILendPool(_addressProvider.getLendPool());
    }
}