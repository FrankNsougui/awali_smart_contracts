// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title LiquidityPool for a single ERC20 token
/// Notes:
/// - deposit: providers transfer token with approve -> deposit.
/// - contract stores token balance; backend observes events to compute USD and mint WAL accordingly.
contract LiquidityPool is ReentrancyGuard, Ownable {
    IERC20 public immutable token; // ERC20 token (e.g. USDT on Ethereum)
    string public poolName;

    event LiquidityAdded(address indexed provider, uint256 tokenAmount, bytes32 depositRef);
    event LiquidityRemoved(address indexed provider, uint256 tokenAmount, bytes32 withdrawRef);
    event TokenReceived(address indexed from, uint256 amount, bytes32 ref);

    constructor(address _token, string memory _poolName) Ownable(msg.sender) {
        require(_token != address(0), "token=0");
        token = IERC20(_token);
        poolName = _poolName;
    }

    /// @notice provider deposits token into pool. Backend will listen event depositRef for offchain bookkeeping.
    function deposit(uint256 amount, bytes32 depositRef) external nonReentrant {
        require(amount > 0, "amount>0");
        // transfer from provider (must have approved)
        bool ok = token.transferFrom(msg.sender, address(this), amount);
        require(ok, "transfer failed");
        emit LiquidityAdded(msg.sender, amount, depositRef);
    }

    /// @notice owner (backend) can withdraw token to an address (used when fulfilling mobile->crypto swaps, or LP withdraws)
    function withdrawTo(address to, uint256 amount, bytes32 withdrawRef) external onlyOwner nonReentrant {
        require(amount > 0, "amount>0");
        require(to != address(0), "to=0");
        bool ok = token.transfer(to, amount);
        require(ok, "transfer failed");
        emit LiquidityRemoved(to, amount, withdrawRef);
    }

    /// @notice receive direct transfers fallback (emit event)
    receive() external payable {
        // if someone sends ETH; emit event (rare for ERC20 pools)
        emit TokenReceived(msg.sender, msg.value, keccak256(abi.encodePacked(block.timestamp, msg.sender)));
    }

    /// @notice helper to get balance
    function poolBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }
}
