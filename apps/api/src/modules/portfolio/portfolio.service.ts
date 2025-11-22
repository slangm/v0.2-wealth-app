import { Injectable } from "@nestjs/common"
import type { LegalDocSlug } from "@globalwealth/content"
import { getLegalDoc } from "@globalwealth/content"

type Holding = {
  id: string
  name: string
  symbol: string
  allocationPct: number
  value: number
  dayChangePct: number
  region: string
}

type PortfolioSnapshot = {
  securityBalance: number
  growthBalance: number
  holdings: Holding[]
  currency: string
  monthlyExpenses: number
}

const holdings: Holding[] = [
  { id: "spy", name: "S&P 500 ETF", symbol: "SPY", allocationPct: 0.45, value: 22450, dayChangePct: 1.2, region: "US" },
  { id: "eth", name: "Ethereum", symbol: "ETH", allocationPct: 0.3, value: 38240, dayChangePct: 4.5, region: "On-chain" },
  { id: "btc", name: "Bitcoin", symbol: "BTC", allocationPct: 0.15, value: 28450, dayChangePct: 2.1, region: "On-chain" },
  { id: "openai", name: "OpenAI Fund", symbol: "OAI", allocationPct: 0.1, value: 15000, dayChangePct: 15.4, region: "Private" },
]

const boosts = [
  { id: "auto-save", label: "Auto Saver", delta: 2.0, description: "Recurring deposit each payday", active: true },
  { id: "education", label: "Learning sprint", delta: 2.0, description: "Completed 2 literacy modules", active: true },
  { id: "referrals", label: "Invite friends", delta: 0.5, description: "2 referral streak", active: true },
]

@Injectable()
export class PortfolioService {
  getSnapshot(): PortfolioSnapshot {
    return {
      securityBalance: 8240,
      growthBalance: 4605,
      holdings,
      currency: "USD",
      monthlyExpenses: 1200,
    }
  }

  getBoosts() {
    return boosts
  }

  recordAllocation(amount: number, target: "protected" | "growth") {
    return {
      amount,
      target,
      status: "queued",
    }
  }

  fetchLegalDoc(slug: LegalDocSlug, locale?: string) {
    return {
      slug,
      locale: locale ?? "en-US",
      content: getLegalDoc(slug, locale),
    }
  }
}

