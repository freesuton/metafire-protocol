// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {ERC721HolderUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/utils/ERC721HolderUpgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

import {Errors} from "../libraries/helpers/Errors.sol";
import {IWETH} from "../interfaces/IWETH.sol";
import {IWETHGateway} from "../interfaces/IWETHGateway.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {IMToken} from "../interfaces/IMToken.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";

import {EmergencyTokenRecoveryUpgradeable} from "./EmergencyTokenRecoveryUpgradeable.sol";

contract WETHGateway is IWETHGateway, ERC721HolderUpgradeable, EmergencyTokenRecoveryUpgradeable {
    ILendPoolAddressesProvider internal _addressProvider;

    IWETH internal WETH;

    mapping(address => bool) internal _callerWhitelists;

    uint256 private constant _NOT_ENTERED = 0;
    uint256 private constant _ENTERED = 1;
    uint256 private _status;

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

    /**
    * @dev Sets the WETH address and the LendPoolAddressesProvider address. Infinite approves lend pool.
    * @param weth Address of the Wrapped Ether contract
    **/
    function initialize(address addressProvider, address weth) public initializer {
      __ERC721Holder_init();
      __EmergencyTokenRecovery_init();

      _addressProvider = ILendPoolAddressesProvider(addressProvider);

      WETH = IWETH(weth);

      WETH.approve(address(_getLendPool()), type(uint256).max);
    }

    function _getLendPool() internal view returns (ILendPool) {
      return ILendPool(_addressProvider.getLendPool());
    }

    function _getLendPoolLoan() internal view returns (ILendPoolLoan) {
      return ILendPoolLoan(_addressProvider.getLendPoolLoan());
    }

    function authorizeLendPoolNFT(address[] calldata nftAssets) external nonReentrant onlyOwner {
      for (uint256 i = 0; i < nftAssets.length; i++) {
        IERC721Upgradeable(nftAssets[i]).setApprovalForAll(address(_getLendPool()), true);
      }
    }

    function authorizeCallerWhitelist(address[] calldata callers, bool flag) external nonReentrant onlyOwner {
      for (uint256 i = 0; i < callers.length; i++) {
        _callerWhitelists[callers[i]] = flag;
      }
    }

    function isCallerInWhitelist(address caller) external view returns (bool) {
      return _callerWhitelists[caller];
    }

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

    function withdrawETH(uint256 amount, address to) external override nonReentrant {
      _checkValidCallerAndOnBehalfOf(to);

      ILendPool cachedPool = _getLendPool();
      IMToken mWETH = IMToken(cachedPool.getReserveData(address(WETH)).mTokenAddress);

      uint256 userBalance = bWETH.balanceOf(msg.sender);
      uint256 amountToWithdraw = amount;

      // if amount is equal to uint(-1), the user wants to redeem everything
      if (amount == type(uint256).max) {
        amountToWithdraw = userBalance;
      }

      mWETH.transferFrom(msg.sender, address(this), amountToWithdraw);
      cachedPool.withdraw(address(WETH), amountToWithdraw, address(this));
      WETH.withdraw(amountToWithdraw);
      _safeTransferETH(to, amountToWithdraw);
    }

    function borrowETH(
      uint256 amount,
      address nftAsset,
      uint256 nftTokenId,
      address onBehalfOf,
      uint16 referralCode
    ) external override nonReentrant {
      _checkValidCallerAndOnBehalfOf(onBehalfOf);

      ILendPool cachedPool = _getLendPool();
      ILendPoolLoan cachedPoolLoan = _getLendPoolLoan();

      uint256 loanId = cachedPoolLoan.getCollateralLoanId(nftAsset, nftTokenId);
      if (loanId == 0) {
        IERC721Upgradeable(nftAsset).safeTransferFrom(msg.sender, address(this), nftTokenId);
      }
      cachedPool.borrow(address(WETH), amount, nftAsset, nftTokenId, onBehalfOf, referralCode);
      WETH.withdraw(amount);
      _safeTransferETH(onBehalfOf, amount);
    }


}