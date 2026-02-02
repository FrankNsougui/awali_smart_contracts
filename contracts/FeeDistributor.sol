// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title FeeDistributor
/// - backend calculates how to split fees and calls distribute to transfer to LPs.
/// - This contract is just a secure helper to do on-chain distribution with transparency.
contract FeeDistributor is Ownable {
    event FeesDistributed(address indexed token, uint256 totalAmount, address[] recipients, uint256[] amounts, uint256 timestamp);

     constructor() Ownable(msg.sender) {}

    /// @notice distribute token amounts to recipients (lengths must match)
    function distributeERC20(address token, address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "len mismatch");
        uint256 total = 0;
        for (uint i = 0; i < amounts.length; i++) total += amounts[i];
        // transfer total from owner (backend) to this contract first, or ensure contract already holds the token
        // safer: require contract has enough balance
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal >= total, "insufficient contract balance");
        for (uint i = 0; i < recipients.length; i++) {
            IERC20(token).transfer(recipients[i], amounts[i]);
        }
        emit FeesDistributed(token, total, recipients, amounts, block.timestamp);
    }

    /// @notice allow owner to withdraw token if needed
    function withdrawERC20(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}
