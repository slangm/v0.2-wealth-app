import { create } from "zustand"

export type Holding = {
  id: string
  name: string
  symbol: string
  allocationPct: number
  value: number
  dayChangePct: number
  region: string
}

export type BoostAction = {
  id: string
  label: string
  delta: number
  description: string
  active: boolean
}

export type Strategy = {
  id: string
  label: string
  flavor: "protected" | "growth"
  apy: number
  breakdown: Array<{ label: string; value: number }>
}

type PortfolioState = {
  locale: string
  currency: string
  monthlyExpenses: number
  securityBalance: number
  growthBalance: number
  holdings: Holding[]
  boosts: BoostAction[]
  strategies: Strategy[]
  lastSync: string | null
  setLocale: (locale: string) => void
  updateSnapshot: (args: { securityBalance: number; growthBalance: number; holdings?: Holding[] }) => void
  markBoostComplete: (id: string) => void
  setBoosts: (boosts: BoostAction[]) => void
  recordAllocation: (args: { strategyId: string; delta: number; target: "protected" | "growth" }) => void
}

const initialHoldings: Holding[] = [
  { id: "spy", name: "S&P 500 ETF", symbol: "SPY", allocationPct: 0.45, value: 22450, dayChangePct: 1.2, region: "US" },
  { id: "eth", name: "Ethereum", symbol: "ETH", allocationPct: 0.3, value: 38240, dayChangePct: 4.5, region: "On-chain" },
  { id: "btcb", name: "Bitcoin", symbol: "BTC", allocationPct: 0.15, value: 28450, dayChangePct: 2.1, region: "On-chain" },
  { id: "openai", name: "OpenAI Fund", symbol: "OAI", allocationPct: 0.1, value: 15000, dayChangePct: 15.4, region: "Private" },
]

const initialBoosts: BoostAction[] = [
  { id: "auto-save", label: "Auto-saver enabled", delta: 2.0, description: "Recurring deposit every payday", active: true },
  { id: "education", label: "2 learning modules completed", delta: 2.0, description: "Keep learning to extend boost", active: true },
  { id: "referrals", label: "Invite 2 friends", delta: 0.5, description: "Refer more friends for extra +0.25%", active: true },
]

const strategies: Strategy[] = [
  {
    id: "protected",
    label: "Protected Savings",
    flavor: "protected",
    apy: 6.5,
    breakdown: [
      { label: "Tokenized T-Bills", value: 70 },
      { label: "Aave GHO Lending", value: 30 },
    ],
  },
  {
    id: "growth",
    label: "Growth Portfolio",
    flavor: "growth",
    apy: 12.4,
    breakdown: [
      { label: "US Broad Market", value: 60 },
      { label: "AI & Tech", value: 25 },
      { label: "Emerging Markets", value: 15 },
    ],
  },
]

export const usePortfolioStore = create<PortfolioState>((set, get) => ({
  locale: "es-AR",
  currency: "USD",
  monthlyExpenses: 1200,
  securityBalance: 8240,
  growthBalance: 4605,
  holdings: initialHoldings,
  boosts: initialBoosts,
  strategies,
  lastSync: null,
  setLocale: (locale) => set({ locale }),
  updateSnapshot: ({ securityBalance, growthBalance, holdings }) =>
    set({
      securityBalance,
      growthBalance,
      holdings: holdings ?? get().holdings,
      lastSync: new Date().toISOString(),
    }),
  setBoosts: (boosts) => set({ boosts }),
  markBoostComplete: (id) =>
    set({
      boosts: get().boosts.map((boost) => (boost.id === id ? { ...boost, active: false } : boost)),
    }),
  recordAllocation: ({ strategyId: _strategyId, delta, target }) =>
    set((state) => {
      const nextSecurity = target === "protected" ? state.securityBalance + delta : state.securityBalance - delta
      const nextGrowth = target === "growth" ? state.growthBalance + delta : state.growthBalance - delta
      return {
        securityBalance: Math.max(nextSecurity, 0),
        growthBalance: Math.max(nextGrowth, 0),
      }
    }),
}))

