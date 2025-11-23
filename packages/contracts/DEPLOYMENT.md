# Deployment Plan

This repo ships three core contracts:

1. `ProtectedSavingsVault.sol` – USD+/USDY backed security vault.
2. `GrowthStrategyVault.sol` – multi-asset allocations (Dinari, ETFs, etc.).
3. `AccountAbstractionGuardian.sol` – AA policy registry for Coinbase Smart Wallets.

## Networks

| Phase | Network | RPC | Notes |
| --- | --- | --- | --- |
| Testing | Base Sepolia | `https://sepolia.base.org` | Gas sponsored by CDP for agent flows |
| RWA Sandbox | Polygon Amoy | `https://rpc-amoy.polygon.technology` | Dinari sandbox lives here |
| Production | Base mainnet / Ethereum | TBD | Requires USD+ or USDY + Aave pool addresses |

## Required env vars

Set the following before running Foundry/Hardhat scripts:

```
export BASE_ASSET=0x...      # USDC / USD+
export SAFE_UNDERLYING_TOKEN=0x...
export GROWTH_UNDERLYING_TOKEN=0x...
export DEPLOYER_KEY=0xabc... # funded wallet
export MAINNET_RPC_URL=https://...
export SEPOLIA_RPC_URL=https://...
```

## Commands

```bash
pnpm --filter @globalwealth/contracts build
pnpm --filter @globalwealth/contracts test

# Example Sepolia deploy
SEPOLIA_RPC_URL=... DEPLOYER_KEY=... \
  pnpm --filter @globalwealth/contracts deploy:sepolia
```

## TODO

- [ ] Finalize USD+/USDY token addresses for each market.
- [ ] Plug Aave pool/router addresses into `safe-allocation.service.ts`.
- [ ] Wire Chainlink price feeds for Growth strategy NAV tracking.
- [ ] Add Dinari custody adapter once production endpoints are available.

Document any deployed addresses in this file to keep the mobile + backend teams in sync.

