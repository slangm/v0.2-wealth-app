// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AccountAbstractionGuardian
 * @notice Minimal policy registry for ERC-4337 smart accounts. The mobile app signs via the guardian key
 *         to enforce daily limits, emergency pauses, and auto-save allowances without taking custody.
 */
contract AccountAbstractionGuardian is Ownable {
    struct Limit {
        uint256 usedToday;
        uint256 lastReset;
    }

    mapping(address => Limit) public limits;
    mapping(address => bool) public pausedAccounts;
    uint256 public globalDailyLimit;

    event DailyLimitUpdated(address indexed account, uint256 amount);
    event SpendRecorded(address indexed account, uint256 amount);
    event AccountPaused(address indexed account, bool paused);

    constructor(uint256 defaultLimit) Ownable(msg.sender) {
        globalDailyLimit = defaultLimit;
    }

    function setGlobalDailyLimit(uint256 newLimit) external onlyOwner {
        globalDailyLimit = newLimit;
    }

    function setAccountLimit(address account, uint256 limit) external onlyOwner {
        limits[account].usedToday = 0;
        limits[account].lastReset = block.timestamp;
        emit DailyLimitUpdated(account, limit);
    }

    function pauseAccount(address account, bool paused) external onlyOwner {
        pausedAccounts[account] = paused;
        emit AccountPaused(account, paused);
    }

    function _resetIfNeeded(address account, uint256 limit) internal {
        if (block.timestamp - limits[account].lastReset >= 1 days) {
            limits[account].usedToday = 0;
            limits[account].lastReset = block.timestamp;
            emit DailyLimitUpdated(account, limit);
        }
    }

    function canSpend(address account, uint256 amount, uint256 limit) public view returns (bool) {
        if (pausedAccounts[account]) return false;
        Limit memory data = limits[account];
        uint256 effectiveLimit = limit == 0 ? globalDailyLimit : limit;
        if (block.timestamp - data.lastReset >= 1 days) {
            return amount <= effectiveLimit;
        }
        return data.usedToday + amount <= effectiveLimit;
    }

    /**
     * @dev Called by the bundler/operator when executing a userOp. The guardian key never takes custody.
     */
    function recordSpend(address account, uint256 amount, uint256 limit) external onlyOwner {
        require(canSpend(account, amount, limit), "Limit exceeded");
        _resetIfNeeded(account, limit);
        limits[account].usedToday += amount;
        emit SpendRecorded(account, amount);
    }
}

