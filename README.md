# Global Wealth & Freedom App

**Short description:** A wealth management mobile app with Coinbase CDP smart wallet + AI agent for emerging markets.

## 🏆 ETHGlobal Submission

### Description
This project is an onchain wealth management app for the emerging-market middle class — think “Robinhood + high-yield savings,” but permissionless and global. Instead of being stuck in fragile local currencies and low bank rates, users move into dollar-denominated, yield-bearing stablecoins (USD+) and tokenized U.S. stocks.  

Onboarding is powered by a Coinbase Developer Platform (CDP) embedded smart wallet, so users don’t need seed phrases or prior Web3 experience. They land in a simple mobile-first interface where they can deposit from an exchange or self-custody wallet and allocate into “vaults” such as USD+ yield or Dinari tokenized equities on Polygon testnet.  

An integrated AI agent (built with CDP AgentKit) turns natural-language requests into onchain actions. A user can say “invest $50 into U.S. stocks every month” or “move my savings to a safer, yield-earning vault,” and the agent reads their positions, simulates the trade, and proposes a transaction for them to approve via the smart wallet. The goal is to make sophisticated, global wealth tools accessible in a few taps.

### How it’s made
- **Frontend / Mobile:** Turborepo with Next.js + Tailwind for the web dashboard and Expo/React Native for the mobile experience. Shared UI primitives live in `packages/ui`.
- **Wallet + AA:** Coinbase Smart Wallet (CDP Embedded Wallet) gives us gas-sponsored transactions, one-tap approvals, and removes seed phrases.
- **AI Agent:** CDP AgentKit + OpenAI orchestrate intents → onchain actions. The agent queries balances, vault metadata, and builds transactions for the user to sign.
- **Smart Contracts:** Solidity ERC-4626-style vaults route deposits into USD+ or tokenized equity strategies. Hardhat/Foundry toolchain handles deployment/tests.
- **RWA Provider:** Dinari sandbox on Polygon testnet powers the tokenized U.S. stock vault so judges can see end-to-end flows.
- **Backend:** NestJS services aggregate off-chain pricing, interact with Dinari APIs, and expose advisor/wallet endpoints.

### Future plans
1. Ship native iOS/Android apps so the product lives alongside a user’s existing neobank tools.
2. Deepen RWA integrations (Dinari for equities, additional issuers for Treasuries/money-market).
3. Add local on/off-ramps in Argentina, Turkey, China, etc., to bridge fiat ↔ onchain portfolios with minimal friction.
4. Deploy more AI guardrails: automated DCA, rebalancing, risk alerts, and policy-based transfers.

The founding team previously built a venture-backed startup with an IP exit to Apple and co-founded an L1 listed on Binance—we’ll leverage that network to secure RWA issuers, exchange partners, and local rails to graduate this from hackathon prototype to production.

---

## Monorepo Layout
- `apps/web` – Next.js App Router frontend (Vercel).
- `apps/mobile` – Expo Router app for iOS/Android (EAS).
- `apps/api` – NestJS backend (Coinbase / Dinari integrations).
- `packages/ui` – Shared design system for web + mobile.
- `packages/contracts` – Solidity ERC-4626 vaults + deployment scripts.
- `packages/content` – Legal copy, disclosures, and localization helpers.

## Getting Started
```bash
pnpm install
pnpm dev        # turbo: web + mobile + api
pnpm dev:web    # Next.js only
pnpm dev:mobile # Expo app
pnpm dev:api    # NestJS backend
```

### Environment Variables
1. Copy `env.example` to `.env.local` (and `.env` for Expo/Nest as needed).
2. Fill in:
   - `NEXT_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_BASE_URL`
   - Coinbase CDP keys (`CDP_API_KEY_NAME`, `CDP_API_KEY_PRIVATE_KEY`)
   - Dinari sandbox keys (`DINARI_API_KEY_ID`, `DINARI_SECRET_KEY`)
   - AI keys (`OPENAI_API_KEY`, `GOOGLE_API_KEY`, etc.)

> ⚠️ Never commit real secrets—use Vercel/Expo secret managers or local `.env` files ignored by git.

---

### Legacy v0.app Deployment Notes
The original prototype (auto-synced from v0.app) is still available:
- Live demo: **https://vercel.com/slangms-projects/v0-fintech-app-design**
- v0 chat: **https://v0.app/chat/ivH7rvQ7jl0**

For the new Turborepo, use the scripts above and deploy via Vercel/EAS.
