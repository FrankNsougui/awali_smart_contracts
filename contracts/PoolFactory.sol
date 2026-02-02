// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./LiquidityPool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PoolFactory is Ownable {
    mapping(address => address) public tokenToPool;
    event PoolCreated(address indexed token, address pool);

    constructor() Ownable(msg.sender) {}

    function createPool(address token, string calldata name) external onlyOwner returns (address) {
        require(token != address(0), "token=0");
        require(tokenToPool[token] == address(0), "exists");
        LiquidityPool p = new LiquidityPool(token, name);
        // transfer ownership of pool to owner (already owner in constructor, but explicit)
        p.transferOwnership(owner());
        tokenToPool[token] = address(p);
        emit PoolCreated(token, address(p));
        return address(p);
    }
}
