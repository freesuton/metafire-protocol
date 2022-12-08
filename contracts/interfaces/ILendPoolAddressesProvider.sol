
interface ILendPoolAddressesProvider {
    function getAddress(bytes32 id) external view returns (address);

    function getLendPool() external view returns (address);
}