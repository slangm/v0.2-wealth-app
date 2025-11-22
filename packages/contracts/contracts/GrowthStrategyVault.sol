// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GrowthStrategyVault
 * @notice Simple ERC-4626 wrapper that tracks whitelisted strategy allocations (SPY, QQQ, tokenized equities, etc.).
 * For v0 we keep exposure metadata on-chain for transparency and allow off-chain execution to follow these targets.
 */
contract GrowthStrategyVault is ERC4626, Ownable {
    struct Allocation {
        address asset;
        uint16 weightBps;
    }

    Allocation[] public allocations;
    uint16 public constant MAX_BPS = 10_000;

    event AllocationUpdated(uint256 indexed index, address asset, uint16 weightBps);
    event Rebalanced(uint256 totalAssetsBefore, uint256 totalAssetsAfter);

    constructor(IERC20 asset_, string memory name_, string memory symbol_, address guardian_)
        ERC4626(asset_)
        ERC20(name_, symbol_)
        Ownable(guardian_)
    {}

    function setAllocations(Allocation[] memory newAllocations) external onlyOwner {
        delete allocations;
        uint256 total;
        for (uint256 i = 0; i < newAllocations.length; i++) {
            require(newAllocations[i].asset != address(0), "Invalid asset");
            total += newAllocations[i].weightBps;
            allocations.push(newAllocations[i]);
            emit AllocationUpdated(i, newAllocations[i].asset, newAllocations[i].weightBps);
        }
        require(total == MAX_BPS, "Weights must sum to 100%");
    }

    function listAllocations() external view returns (Allocation[] memory) {
        return allocations;
    }

    function rebalance() external onlyOwner {
        uint256 beforeAssets = totalAssets();
        // In production this would call adapters that rebalance into target instruments.
        emit Rebalanced(beforeAssets, totalAssets());
    }
}

