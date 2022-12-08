// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {ERC721HolderUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import {Errors} from "../libraries/helpers/Errors.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {IWETHGateway} from "../interfaces/IWETHGateway.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";

contract WETHGateway  {
    ILendPoolAddressesProvider internal _addressProvider;

    IWETH internal WETH;

    mapping(address => bool) internal _callerWhitelists;
    function _checkValidCallerAndOnBehalfOf(address onBehalfOf) internal view {
    require(
      (onBehalfOf == _msgSender()) || (_callerWhitelists[_msgSender()] == true),
      Errors.CALLER_NOT_ONBEHALFOF_OR_IN_WHITELIST
    );
  }

    function depositETH(address onBehalfOf, uint16 referralCode) external payable nonReentrant {
        _checkValidCallerAndOnBehalfOf(onBehalfOf);

        ILendPool cachedPool = _getLendPool();
        WETH.deposit{value: msg.value}();
        cachedPool.deposit(address(WETH), msg.value, onBehalfOf, referralCode);
    }

    function _getLendPool() internal view returns (ILendPool) {
        return ILendPool(_addressProvider.getLendPool());
    }
}