import { calculateLadderProgress } from "@globalwealth/ui"

import { apiGet, apiPost } from "./api-client"
import type { Holding, BoostAction } from "../store/portfolio"

export type PortfolioSnapshot = {
  securityBalance: number
  growthBalance: number
  holdings: Holding[]
  currency: string
  monthlyExpenses: number
}

const fallbackSnapshot: PortfolioSnapshot = {
  securityBalance: 8240,
  growthBalance: 4605,
  currency: "USD",
  monthlyExpenses: 1200,
  holdings: [
    { id: "spy", name: "S&P 500 ETF", symbol: "SPY", allocationPct: 0.45, value: 22450, dayChangePct: 1.2, region: "US" },
    { id: "eth", name: "Ethereum", symbol: "ETH", allocationPct: 0.3, value: 38240, dayChangePct: 4.5, region: "On-chain" },
    { id: "btc", name: "Bitcoin", symbol: "BTC", allocationPct: 0.15, value: 28450, dayChangePct: 2.1, region: "On-chain" },
    { id: "openai", name: "OpenAI Fund", symbol: "OAI", allocationPct: 0.1, value: 15000, dayChangePct: 15.4, region: "Private" },
  ],
}

const fallbackBoosts: BoostAction[] = [
  { id: "auto-save", label: "Auto-saver enabled", delta: 2, description: "Recurring ARS 50k every payday", active: true },
  { id: "education", label: "2 learning modules complete", delta: 2, description: "Expires in 28 days", active: true },
  { id: "referrals", label: "Invite 2 friends", delta: 0.5, description: "Invite 1 more friend for +0.25%", active: true },
]

export async function fetchPortfolioSnapshot(): Promise<PortfolioSnapshot> {
  try {
    return await apiGet<PortfolioSnapshot>("/portfolio")
  } catch {
    return fallbackSnapshot
  }
}

export async function fetchBoosts(): Promise<BoostAction[]> {
  try {
    return await apiGet<BoostAction[]>("/portfolio/boosts")
  } catch {
    return fallbackBoosts
  }
}

export async function simulateProjection({
  monthlyContribution,
  years,
  baseRate,
}: {
  monthlyContribution: number
  years: number
  baseRate: number
}) {
  const months = years * 12
  let balance = 0
  const history: Array<{ month: number; balance: number }> = []
  const monthlyRate = baseRate / 12 / 100

  for (let i = 1; i <= months; i++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution
    if (i % 3 === 0) {
      history.push({ month: i, balance: Number(balance.toFixed(2)) })
    }
  }

  return history
}

export async function recordAllocation(payload: { strategyId: string; amount: number; target: "protected" | "growth" }) {
  try {
    await apiPost("/portfolio/allocate", payload)
  } catch {
    // noop – offline friendly
  }
  return payload
}

export function getLadderCopy(totalNetWorth: number, monthlyExpenses: number) {
  const ladder = calculateLadderProgress({ totalNetWorth, monthlyExpenses })
  if (ladder.security < 100) {
    return {
      headline: "Finish your 6-month safety net",
      body: "Move spare cash into Protected Savings until you hit the 6 month target.",
    }
  }
  if (ladder.freedom < 10) {
    return {
      headline: "Great! Redirect extra deposits into Growth",
      body: "You have a healthy emergency fund. Set automated splits to speed up growth.",
    }
  }
  return {
    headline: "Freedom flywheel unlocked",
    body: "Keep stacking diversified exposure and plan milestone withdrawals with the advisor.",
  }
}

