// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";

import {ILendPool} from "../interfaces/ILendPool.sol";
import {IMToken} from "../interfaces/IMToken.sol";
import {IIncentivesController} from "../interfaces/IIncentivesController.sol";
import {IncentivizedERC20} from "./IncentivizedERC20.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {Errors} from "../libraries/helpers/Errors.sol";

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MToken {

    using WadRayMath for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    ILendPoolAddressesProvider internal _addressProvider;
    address internal _treasury;
    address internal _underlyingAsset;

    modifier onlyLendPool() {
        require(_msgSender() == address(_getLendPool()), Errors.CT_CALLER_MUST_BE_LEND_POOL);
        _;
    }

    /**
    * @dev Initializes the bToken
    * @param addressProvider The address of the address provider where this bToken will be used
    * @param treasury The address of the Bend treasury, receiving the fees on this bToken
    * @param underlyingAsset The address of the underlying asset of this bToken
    */
    function initialize(
        ILendPoolAddressesProvider addressProvider,
        address treasury,
        address underlyingAsset,
        uint8 bTokenDecimals,
        string calldata bTokenName,
        string calldata bTokenSymbol
    ) external override initializer {
        __IncentivizedERC20_init(bTokenName, bTokenSymbol, bTokenDecimals);

        _treasury = treasury;
        _underlyingAsset = underlyingAsset;

        _addressProvider = addressProvider;

        emit Initialized(
        underlyingAsset,
        _addressProvider.getLendPool(),
        treasury,
        _addressProvider.getIncentivesController()
        );
    }

    /**
    * @dev Mints `amount` bTokens to `user`
    * - Only callable by the LendPool, as extra state updates there need to be managed
    * @param user The address receiving the minted tokens
    * @param amount The amount of tokens getting minted
    * @param index The new liquidity index of the reserve
    * @return `true` if the the previous balance of the user was 0
    */
    function mint(
        address user,
        uint256 amount,
        uint256 index
    ) external override onlyLendPool returns (bool) {
        uint256 previousBalance = super.balanceOf(user);

        // index is expressed in Ray, so:
        // amount.wadToRay().rayDiv(index).rayToWad() => amount.rayDiv(index)
        uint256 amountScaled = amount.rayDiv(index);
        require(amountScaled != 0, Errors.CT_INVALID_MINT_AMOUNT);
        _mint(user, amountScaled);

        emit Mint(user, amount, index);

        return previousBalance == 0;
    }

    function burn(
        address user,
        address receiverOfUnderlying,
        uint256 amount,
        uint256 index
    ) external override onlyLendPool {
        uint256 amountScaled = amount.rayDiv(index);
        require(amountScaled != 0, Errors.CT_INVALID_BURN_AMOUNT);
        _burn(user, amountScaled);

        IERC20Upgradeable(_underlyingAsset).safeTransfer(receiverOfUnderlying, amount);

        emit Burn(user, receiverOfUnderlying, amount, index);
    }

    

}