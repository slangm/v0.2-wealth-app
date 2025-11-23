# Global Wealth & Freedom – Hackathon Snapshot

We set out to give emerging-market savers a “Robinhood + high-yield savings” super-app: AI-assisted allocations, protected USD+ runway, Dinari-stock exposure, and embedded wallets that hide all of the crypto sharp edges.

This README documents what exists today, what’s still rough, and which pieces failed during the hackathon push so judges/reviewers know exactly where the repo stands.

---

## TL;DR

| Area | What works today | What’s still broken / missing |
| --- | --- | --- |
| **Mobile (Expo)** | Expo Router app with onboarding, protected/growth dashboards, advisor chat UI, and Privy-powered Google login mock | EAS iOS builds fail because `react-native@0.76.3` + Reanimated 4.1.5 conflict. Needs RN upgrade or Reanimated 3.x pin. |
| **Auth** | Privy SDK wired in; Google OAuth UI + session hook | Backend still expects Coinbase CDP tokens; no Privy JWT verification yet, so real API calls are mocked. |
| **AI Advisor** | Frontend flow with optimistic chat + toast handling, offline copy fallback | Nest `apps/api` agent endpoints still stubbed; no live inference tied to Privy login. |
| **Deployments** | Web + API run locally via Turborepo; Expo dev server works | No successful `eas build` artifact; Expo project blocked at pod install. |

---

## Vision
- **Global runway planning:** Help LATAM/MEA users build six-month “Security” ladders and longer “Freedom” runways in USD+ stable yield.
- **AI copilot:** Transform natural-language intents (“route $50 into growth if CPI < 5%”) into actionable portfolio moves.
- **Embedded wallets:** Privy + passkeys (moving away from our earlier Coinbase CDP approach) so onboarding feels like a neobank login, not Web3.
- **Tokenized equity access:** Dinari sandbox equities on Polygon testnet illustrate regulated RWA rails.

---

## Monorepo Overview

- `apps/web` – Next.js dashboard (unused in latest demo but still builds).
- `apps/mobile` – Expo Router client (primary hackathon surface).
- `apps/api` – NestJS backend for advisors, Dinari proxies, Coinbase/Privy stubs.
- `packages/ui` – Shared design tokens + React components.
- `packages/contracts` – ERC-4626 vault prototypes (USD+ / Protected Savings).
- `packages/content` – Legal copy + localized disclosures.

Tooling: Turborepo, pnpm workspaces, Tailwind, Hardhat, Expo Router v2.

---

## What We Built During the Hackathon

1. **Privy-based onboarding**
   - Google OAuth button, PrivyProvider wiring, token hydration hook.
   - Session-aware tab router + settings screen sign-out.
2. **Portfolio surfaces**
   - Security/Growth cards with boost lists, holdings, deposit modals.
   - Simulations + “AI-only” beefy vault mock to demo guardrails.
3. **Advisor UX**
   - Chat composer, optimistic updates, toast notifications for API success/fail.
   - Fallback copy/logic when the backend is offline.
4. **Backend scaffolding**
   - Nest modules for advisor, payments, Dinari RWA, wallet sync.
   - Content/legal packages consumed by both web + mobile.

---

## What Didn’t Ship / Known Issues

- **EAS iOS build failures**  
  `react-native-reanimated@4.1.5` requires RN ≥0.80, but Expo SDK 54 includes RN 0.76.3. Pod install halts with:  
  `Invalid 'RNReanimated.podspec': React Native version is not compatible.`  
  *Fix:* upgrade to Expo SDK 59 (RN 0.81) **or** pin Reanimated to `~3.10.1` before running `eas build`.

- **Backend still expects Coinbase tokens**  
  We migrated the app to Privy but never updated the Nest API to verify Privy JWKS (`https://auth.privy.io/api/v1/apps/cmibbfcuy00v9lh0ciog0iet6/jwks.json`). `advisor`, `portfolio`, and `payments` endpoints still assume CDP-issued JWTs, so mobile falls back to mocked responses.

- **No production wallet actions**  
  Contracts + Safe interactions exist in the repo, but the mobile flow only simulates deposits/allocations. Funding transactions and Dinari order placement remain TODOs.

- **Web app lagging behind**  
  `apps/web` still talks about the original CDP flow; we did not retrofit Privy login there. Treat it as an archive of earlier design explorations.

---

## Getting Started Locally

```bash
pnpm install
cp env.example .env             # root env for API/web
cp apps/mobile/.env apps/mobile/.env.local  # optional mobile override

# Dev servers
pnpm dev            # turbo dev:web + dev:mobile + dev:api
pnpm dev:web        # Next.js only
pnpm dev:mobile     # Expo only (same as npx expo start --clear)
pnpm dev:api        # NestJS backend
```

Key env vars you must supply (see `env.example` for full list):
- `EXPO_PUBLIC_API_BASE_URL` – base URL for the Nest API (or mock server)
- `EXPO_PUBLIC_PRIVY_APP_ID` / `EXPO_PUBLIC_PRIVY_CLIENT_ID`
- `OPENAI_API_KEY`, `GOOGLE_API_KEY`
- `DINARI_API_KEY_ID`, `DINARI_SECRET_KEY`

Never commit real secrets; use Expo/Vercel secret managers in production.

---

## Building & Deploying

### Expo (mobile)
```bash
eas login
eas build --profile preview --platform ios   # simulator build
```
If the build fails during “Install pods” with a Reanimated error, run:
```bash
cd apps/mobile
npx expo install react-native-reanimated@~3.10.1
git commit && eas build ...
```
or upgrade to the newest Expo SDK (requires RN 0.81 and dependency bumps).

### Web & API
- Deploy `apps/web` to Vercel (App Router, edge-ready).
- Deploy `apps/api` anywhere Node 20 runs (Nest + PostgreSQL). Environment keys match those in `env.example`.

---

## Roadmap After Hackathon

1. **Finish Privy<>Backend integration** – verify Privy JWTs, mint embedded wallets, and issue onchain actions with proper auth.
2. **Stitch real advisor responses** – connect the Nest “agent” module to OpenAI + onchain data sources; remove mocked ladder copy.
3. **Complete EAS builds** – upgrade Expo SDK / RN, run through iOS and Android store submissions.
4. **Connect funding rails** – add local bank on-ramps (Argentina, Turkey, Nigeria) using P2P or partner APIs.
5. **Production vault accounting** – wire contracts and Safe automation so “Protected Savings” and “Growth Vault” balances reflect live onchain positions.

---

## Legacy Links
- v0 auto-generated concept: https://vercel.com/slangms-projects/v0-fintech-app-design  
- v0 design chat: https://v0.app/chat/ivH7rvQ7jl0

---

Thanks for reviewing the repo! Please reach out if you need clarification on any of the unfinished pieces or want to continue the build after the hackathon. 💸🌍
