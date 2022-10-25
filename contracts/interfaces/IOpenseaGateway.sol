// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;

import "../libraries/types/OpenseaTypes.sol";
interface IOpenseaGateway {
  
   function fulfillBasicOrder(OpenseaLib.BasicOrderParameters memory parameters) external payable returns (bool fulfilled);

}