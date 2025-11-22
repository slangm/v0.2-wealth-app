# Contracts

This package contains the on-chain architecture backing the Protected Savings and Growth strategies described in the PRD.

## Layout

- `ProtectedSavingsVault.sol` – ERC4626 wrapper that routes USDC deposits into a single conservative RWA/Aave strategy. Base APY + booster metadata are stored on-chain for transparency.
- `GrowthStrategyVault.sol` – ERC4626 vault with programmable allocation targets (SPY, AI, EM). Off-chain operators mirror the weights while the metadata remains auditable.
- `AccountAbstractionGuardian.sol` – Lightweight policy registry for ERC-4337 smart accounts (daily limits, emergency pause, exit-to-self-custody).
- `contracts/mocks` – local testing helpers.
- `scripts/deploy.ts` – reference deployment script for Sepolia/Mainnet.

## Workflows

```bash
pnpm --filter @globalwealth/contracts build
pnpm --filter @globalwealth/contracts test
BASE_ASSET=0x... DEPLOYER_KEY=0x... pnpm --filter @globalwealth/contracts deploy:sepolia
```

Before mainnet, set `strategy` addresses and configure AA guardians per market.***

