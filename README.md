# Global Wealth & Freedom App

This repository contains the cross-platform Global Wealth & Freedom experience described in the v0.2 PRD. It is organized as a Turborepo with independently deployable apps and shared packages:

- `apps/web` – Next.js marketing shell + rich pre-login experience from v0.
- `apps/mobile` – Expo Router app that delivers the end-to-end “security → growth” ladder for iOS & Android.
- `apps/api` – TypeScript backend for identity, portfolio aggregation, payments, and AI advisor context APIs.
- `packages/ui` – Cross-platform design tokens & primitives shared between web/mobile.
- `packages/contracts` – Ethereum mainnet smart contracts (ERC-4626 vaults, strategy routers, AA guardian) with Foundry/Hardhat toolchain.
- `packages/content` – Localized markdown surfaces for disclosures, ToS, and trust copy.

## Getting Started

```bash
pnpm install
pnpm dev        # runs all dev servers via turbo
pnpm dev:web    # run only the Next.js app
pnpm dev:mobile # start the Expo app (EAS or Expo Go)
pnpm dev:api    # start the backend API
```

Additional documentation for each workspace lives in its respective folder.

