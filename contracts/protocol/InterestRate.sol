// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {IInterestRate} from "../interfaces/IInterestRate.sol";
import {ILendPoolAddressesProvider} from "../interfaces/ILendPoolAddressesProvider.sol";
import {WadRayMath} from "../libraries/math/WadRayMath.sol";
import {PercentageMath} from "../libraries/math/PercentageMath.sol";
import {DataTypes} from "../libraries/types/DataTypes.sol";
import {IMToken} from "../interfaces/IMToken.sol";

import {IERC20Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

/**
 * @title InterestRate contract
 * @notice Implements the calculation of the interest rates depending on the reserve state
 * @dev The model of interest rate is based on 2 slopes, one before the `OPTIMAL_UTILIZATION_RATE`
 * point of utilization and another from that one to 100%
 * @author MetaFire
 **/
contract InterestRate is IInterestRate {
  using WadRayMath for uint256;
  using PercentageMath for uint256;

  ILendPoolAddressesProvider public immutable addressesProvider;

  /**
   * @dev this constant represents the utilization rate at which the pool aims to obtain most competitive borrow rates.
   * Expressed in ray
   **/
  uint256 public immutable OPTIMAL_UTILIZATION_RATE;

  /**
   * @dev This constant represents the excess utilization rate above the optimal. It's always equal to
   * 1-optimal utilization rate. Added as a constant here for gas optimizations.
   * Expressed in ray
   **/

  uint256 public immutable EXCESS_UTILIZATION_RATE;

  // Base variable borrow rate when Utilization rate = 0. Expressed in ray
  uint256 internal immutable _baseVariableBorrowRate;

  // Slope of the variable interest curve when utilization rate > 0 and <= OPTIMAL_UTILIZATION_RATE. Expressed in ray
  uint256 internal immutable _variableRateSlope1;

  // Slope of the variable interest curve when utilization rate > OPTIMAL_UTILIZATION_RATE. Expressed in ray
  uint256 internal immutable _variableRateSlope2;

  uint256[4] internal _distributeCoefficients;

  constructor(
    ILendPoolAddressesProvider provider,
    uint256 optimalUtilizationRate_,
    uint256 baseVariableBorrowRate_,
    uint256 variableRateSlope1_,
    uint256 variableRateSlope2_,
    uint256[4] memory distributeCoefficients_
  ) {
    addressesProvider = provider;
    OPTIMAL_UTILIZATION_RATE = optimalUtilizationRate_;
    EXCESS_UTILIZATION_RATE = WadRayMath.ray() - (optimalUtilizationRate_);
    _baseVariableBorrowRate = baseVariableBorrowRate_;
    _variableRateSlope1 = variableRateSlope1_;
    _variableRateSlope2 = variableRateSlope2_;
    _distributeCoefficients = distributeCoefficients_;
  }

  function variableRateSlope1() external view returns (uint256) {
    return _variableRateSlope1;
  }

  function variableRateSlope2() external view returns (uint256) {
    return _variableRateSlope2;
  }

  function baseVariableBorrowRate() external view override returns (uint256) {
    return _baseVariableBorrowRate;
  }

  function getMaxVariableBorrowRate() external view override returns (uint256) {
    return _baseVariableBorrowRate + (_variableRateSlope1) + (_variableRateSlope2);
  }

  function getDistributeCoefficients() external view returns (uint256[4] memory) {
    return _distributeCoefficients;
  }

  /**
   * @dev Calculates the interest rates depending on the reserve's state and configurations
   * @param reserve The address of the reserve
   * @param targetMToken The address of the target mToken
   * @param liquidityAdded The liquidity added during the operation
   * @param liquidityTaken The liquidity taken during the operation
   * @param totalVariableDebt The total borrowed from the reserve at a variable rate
   * @param reserveFactor The reserve portion of the interest that goes to the treasury of the market
   * @return The liquidity rate, the stable borrow rate and the variable borrow rate
   **/
  function calculateInterestRates(
    DataTypes.ReserveData memory reserve,
    address targetMToken,
    uint256 liquidityAdded,
    uint256 liquidityTaken,
    uint256 totalVariableDebt,
    uint256 reserveFactor
  ) external view override returns (uint256[4] memory, uint256) {
    // get total available liquidity
    uint256 totalLiquidity;
    uint256[4] memory liquidities;
    for (uint256 i = 0; i < reserve.mTokenAddresses.length; i++) {
      address mToken = reserve.mTokenAddresses[i];
      if(mToken == targetMToken){
        liquidities[i] = IMToken(mToken).scaledTotalSupply().rayMul(reserve.liquidityIndices[i]) + liquidityAdded - liquidityTaken;
      }else{
        liquidities[i] = IMToken(mToken).scaledTotalSupply().rayMul(reserve.liquidityIndices[i]);
      }
      totalLiquidity += liquidities[i];
    }

    return calculateInterestRates(reserve, totalLiquidity, totalVariableDebt, reserveFactor, liquidities);
  }

  struct CalcInterestRatesLocalVars {
    uint256 totalDebt;
    uint256 currentVariableBorrowRate;
    uint256 currentLiquidityBaseRate;
    uint256 utilizationRate;
  }

  /**
   * @dev Calculates the interest rates depending on the reserve's state and configurations.
   * NOTE This function is kept for compatibility with the previous DefaultInterestRateStrategy interface.
   * New protocol implementation uses the new calculateInterestRates() interface
   * @param reserve The address of the reserve
   * @param totalLiquidity The liquidity available in the corresponding mToken
   * @param totalVariableDebt The total borrowed from the reserve at a variable rate
   * @param reserveFactor The reserve portion of the interest that goes to the treasury of the market
   * @return The liquidity rate and the variable borrow rate
   **/
  function calculateInterestRates(
    DataTypes.ReserveData memory reserve,
    uint256 totalLiquidity,
    uint256 totalVariableDebt,
    uint256 reserveFactor,
    uint256[4] memory liquidities
  ) public view override returns (uint256[4] memory, uint256) {
    reserve;

    CalcInterestRatesLocalVars memory vars;

    vars.totalDebt = totalVariableDebt;
    vars.currentVariableBorrowRate = 0;
    vars.currentLiquidityBaseRate = 0;

    vars.utilizationRate = vars.totalDebt == 0 ? 0 : vars.totalDebt.rayDiv(totalLiquidity);

    uint256[4] memory currentLiquidityRates;

    if (vars.utilizationRate > OPTIMAL_UTILIZATION_RATE) {
      uint256 excessUtilizationRateRatio = (vars.utilizationRate - (OPTIMAL_UTILIZATION_RATE)).rayDiv(
        EXCESS_UTILIZATION_RATE
      );

      vars.currentVariableBorrowRate =
        _baseVariableBorrowRate +
        (_variableRateSlope1) +
        (_variableRateSlope2.rayMul(excessUtilizationRateRatio));
    } else {
      vars.currentVariableBorrowRate =
        _baseVariableBorrowRate +
        (vars.utilizationRate.rayMul(_variableRateSlope1).rayDiv(OPTIMAL_UTILIZATION_RATE));
    }

    uint256 weightedLiquiditySum = 1;
    for (uint256 i = 0; i < reserve.mTokenAddresses.length; i++) {
      address mToken = reserve.mTokenAddresses[i];
      weightedLiquiditySum += liquidities[i].rayMul(_distributeCoefficients[i]);
    }

    vars.currentLiquidityBaseRate = _getOverallBorrowRate(totalVariableDebt, vars.currentVariableBorrowRate)
      .rayMul(vars.utilizationRate)
      .rayMul(totalLiquidity);

    vars.currentLiquidityBaseRate = vars.currentLiquidityBaseRate
      .rayDiv(weightedLiquiditySum);
      // .percentMul(PercentageMath.PERCENTAGE_FACTOR - (reserveFactor));
      

    for(uint256 i = 0; i < reserve.mTokenAddresses.length; i++) {
      currentLiquidityRates[i] =  _distributeCoefficients[i].rayMul(vars.currentLiquidityBaseRate);
    }

    return (currentLiquidityRates, vars.currentVariableBorrowRate);
  }

  /**
   * @dev Calculates the overall borrow rate as the weighted average between the total variable debt and total stable debt
   * @param totalVariableDebt The total borrowed from the reserve at a variable rate
   * @param currentVariableBorrowRate The current variable borrow rate of the reserve
   * @return The weighted averaged borrow rate
   **/
  function _getOverallBorrowRate(uint256 totalVariableDebt, uint256 currentVariableBorrowRate)
    internal
    pure
    returns (uint256)
  {
    uint256 totalDebt = totalVariableDebt;

    if (totalDebt == 0) return 0;

    uint256 weightedVariableRate = totalVariableDebt.wadToRay().rayMul(currentVariableBorrowRate);

    uint256 overallBorrowRate = weightedVariableRate.rayDiv(totalDebt.wadToRay());

    return overallBorrowRate;
  }
}
