// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.17;




contract BToken is Initializable {

    uint8 private _customDecimals;

    function __IncentivizedERC20_init(
        string memory name_,
        string memory symbol_,
        uint8 decimals_
    ) internal initializer {
        __ERC20_init(name_, symbol_);

        _customDecimals = decimals_;
    }

    /**
    * @dev Returns the decimals of the token.
    */
    function decimals() public view virtual override(ERC20Upgradeable, IERC20MetadataUpgradeable) returns (uint8) {
    return _customDecimals;
    }

    /**
    * @return Abstract function implemented by the child bToken/debtToken.
    * Done this way in order to not break compatibility with previous versions of bTokens/debtTokens
    **/
    function _getIncentivesController() internal view virtual returns (IIncentivesController);

    function _getUnderlyingAssetAddress() internal view virtual returns (address);

    function _transfer(
        address sender,
        address recipient,
        uint256 amount
    ) internal virtual override {
        uint256 oldSenderBalance = super.balanceOf(sender);
        uint256 oldRecipientBalance = super.balanceOf(recipient);

        super._transfer(sender, recipient, amount);

        if (address(_getIncentivesController()) != address(0)) {
            uint256 currentTotalSupply = super.totalSupply();
            _getIncentivesController().handleAction(sender, currentTotalSupply, oldSenderBalance);
            
            if (sender != recipient) {
                _getIncentivesController().handleAction(recipient, currentTotalSupply, oldRecipientBalance);
            }
        }
    }

}