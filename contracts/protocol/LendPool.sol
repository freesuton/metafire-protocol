// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import {ILendPoolLoan} from "../interfaces/ILendPoolLoan.sol";
import {ILendPool} from "../interfaces/ILendPool.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";

import {Errors} from "../libraries/helpers/Errors.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {GenericLogic} from "../libraries/logic/GenericLogic.sol";
import {PercentageMath} from "../libraries/math/PercentageMath.sol";
import {ReserveLogic} from "../libraries/logic/ReserveLogic.sol";
// import {NftLogic} from "../libraries/logic/NftLogic.sol";
import {ValidationLogic} from "../libraries/logic/ValidationLogic.sol";
import {SupplyLogic} from "../libraries/logic/SupplyLogic.sol";
// import {BorrowLogic} from "../libraries/logic/BorrowLogic.sol";
// import {LiquidateLogic} from "../libraries/logic/LiquidateLogic.sol";

import {ReserveConfiguration} from "../libraries/configuration/ReserveConfiguration.sol";
import {NftConfiguration} from "../libraries/configuration/NftConfiguration.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {LendPoolStorage} from "./LendPoolStorage.sol";
import {LendPoolStorageExt} from "./LendPoolStorageExt.sol";

import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import {SafeERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import {IERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";
import {IERC721ReceiverUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ContextUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract LendPool is   
    Initializable,
    ILendPool,
    LendPoolStorage,
    ContextUpgradeable,
    IERC721ReceiverUpgradeable,
    LendPoolStorageExt
{
    using WadRayMath for uint256;
    using PercentageMath for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using ReserveLogic for DataTypes.ReserveData;
    // using NftLogic for DataTypes.NftData;
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using NftConfiguration for DataTypes.NftConfigurationMap;

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
    * @dev Function is invoked by the proxy contract when the LendPool contract is added to the
    * LendPoolAddressesProvider of the market.
    * - Caching the address of the LendPoolAddressesProvider in order to reduce gas consumption
    *   on subsequent operations
    * @param provider The address of the LendPoolAddressesProvider
    **/
    function initialize(ILendPoolAddressesProvider provider) public initializer {
        _maxNumberOfReserves = 32;
        _maxNumberOfNfts = 256;

        _addressesProvider = provider;
    }

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
            onBehalfOf: onBehalfOf,
            referralCode: referralCode
            })
        );
    }
}