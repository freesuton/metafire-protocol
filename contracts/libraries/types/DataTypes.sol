// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

library DataTypes {

  struct ReserveData {
    //stores the reserve configuration
    ReserveConfigurationMap configuration;
    // //the variable liquidity index. Expressed in ray
    // uint128 vLiquidityIndex;
    // //the 4 months liquidity index. Expressed in ray
    // uint128 fourMonthLiquidityIndex;
    // //the 7 months liquidity index. Expressed in ray
    // uint128 sevenMonthLiquidityIndex;
    // //the 10 months liquidity index. Expressed in ray
    // uint128 tenMonthLiquidityIndex;
    // //the 13 months liquidity index. Expressed in ray
    // uint128 thirteenMonthLiquidityIndex;

    // interest mode -> liquidity index
    mapping(uint256 => uint128) liquidityIndexList;
    //variable borrow index. Expressed in ray
    uint128 variableBorrowIndex;
    //the current supply rate. Expressed in ray
    uint128 currentBaseLiquidityRate;
    //the current variable borrow rate. Expressed in ray
    uint128 currentVariableBorrowRate;
    uint40 lastUpdateTimestamp;
    // interest mode -> mToken address
    mapping(uint256 => address) mTokenList;
    address debtTokenAddress;
    //address of the interest rate strategy
    address interestRateAddress;
    //the id of the reserve. Represents the position in the list of the active reserves
    uint8 id;
  }

  struct NftData {
    //stores the nft configuration
    NftConfigurationMap configuration;
    //address of the mNFT contract
    address mNftAddress;
    //the id of the nft. Represents the position in the list of the active nfts
    uint8 id;
    uint256 maxSupply;
    uint256 maxTokenId;
  }

  struct ReserveConfigurationMap {
    //bit 0-15: LTV
    //bit 16-31: Liq. threshold
    //bit 32-47: Liq. bonus
    //bit 48-55: Decimals
    //bit 56: Reserve is active
    //bit 57: reserve is frozen
    //bit 58: borrowing is enabled
    //bit 59: stable rate borrowing enabled
    //bit 60-63: reserved
    //bit 64-79: reserve factor
    uint256 data;
  }

  struct NftConfigurationMap {
    //bit 0-15: LTV
    //bit 16-31: Liq. threshold
    //bit 32-47: Liq. bonus
    //bit 56: NFT is active
    //bit 57: NFT is frozen
    uint256 data;
  }

  struct ExecuteDepositParams {
    address initiator;
    address asset;
    uint256 amount;
    uint256 interestRateMode;
    address onBehalfOf;
    uint16 referralCode;
  }
}