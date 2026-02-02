// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title SwapReceiver
/// - users call depositForSwap with a swapUid (client idempotency)
/// - contract emits event that backend listens to; backend validates onchain tx and continues swap (calls Campay, etc.)
contract SwapReceiver is ReentrancyGuard, Ownable {
    event SwapDeposit(
        bytes32 indexed swapUid,
        address indexed user,
        address token,
        uint256 amount,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    /// @notice user deposits token for swap; backend listens to SwapDeposit to trigger offchain steps
    function depositForSwap(bytes32 swapUid, address token, uint256 amount) external nonReentrant {
        require(amount > 0, "amount>0");
        require(swapUid != bytes32(0), "swapUid required");
        // transfer token to this contract
        bool ok = IERC20(token).transferFrom(msg.sender, address(this), amount);
        require(ok, "transfer failed");
        emit SwapDeposit(swapUid, msg.sender, token, amount, block.timestamp);
    }

    /// @notice owner can release token to a pool (called by backend once swap is processed)
    function releaseToPool(address token, address pool, uint256 amount, bytes32 ref) external onlyOwner nonReentrant {
        require(pool != address(0), "pool=0");
        bool ok = IERC20(token).transfer(pool, amount);
        require(ok, "transfer failed");
        // optionally emit an event to track release
        emit SwapDeposit(ref, address(this), token, amount, block.timestamp); // reuse for tracking (or create separate event)
    }

    /// @notice optional: recover stuck ERC20 by owner
    function rescueERC20(address token, address to, uint256 amount) external onlyOwner {
        IERC20(token).transfer(to, amount);
    }
}
