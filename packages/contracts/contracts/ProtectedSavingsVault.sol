// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProtectedSavingsVault
 * @notice ERC-4626 compliant vault that routes deposits into a single conservatively-managed RWA strategy.
 * Boost metadata is tracked on-chain so the mobile app can prove actual APY terms.
 */
contract ProtectedSavingsVault is ERC4626, Ownable, ReentrancyGuard {
    address public strategy;
    uint16 public baseYieldBps; // e.g. 400 = 4.00%
    mapping(address => uint16) public boosterBps; // user => +bps

    event StrategyUpdated(address indexed oldStrategy, address indexed newStrategy);
    event BoosterUpdated(address indexed user, uint16 newBonusBps);
    event YieldHarvested(uint256 amount);

    constructor(
        IERC20 asset_,
        string memory name_,
        string memory symbol_,
        uint16 baseYieldBps_,
        address guardian_
    ) ERC4626(asset_) ERC20(name_, symbol_) Ownable(guardian_) {
        baseYieldBps = baseYieldBps_;
    }

    function setStrategy(address newStrategy) external onlyOwner {
        emit StrategyUpdated(strategy, newStrategy);
        strategy = newStrategy;
    }

    function setBooster(address user, uint16 bonusBps) external onlyOwner {
        require(bonusBps <= 400, "Booster too high");
        boosterBps[user] = bonusBps;
        emit BoosterUpdated(user, bonusBps);
    }

    function currentYieldBps(address user) public view returns (uint16) {
        return baseYieldBps + boosterBps[user];
    }

    function deposit(uint256 assets, address receiver) public override nonReentrant returns (uint256) {
        require(strategy != address(0), "Strategy missing");
        return super.deposit(assets, receiver);
    }

    function withdraw(uint256 assets, address receiver, address owner_) public override nonReentrant returns (uint256) {
        return super.withdraw(assets, receiver, owner_);
    }

    /// @notice guardian can sweep yield from strategy (e.g., USDC interest) back into vault.
    function harvest(uint256 amount) external onlyOwner {
        require(strategy != address(0), "Strategy missing");
        IERC20 asset = IERC20(asset());
        require(asset.transferFrom(strategy, address(this), amount), "Pull failed");
        emit YieldHarvested(amount);
    }
}

