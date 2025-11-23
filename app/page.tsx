"use client"

import { PortfolioChart } from "@/components/portfolio-chart"
import { BottomNav } from "@/components/bottom-nav"
import { Onboarding } from "@/components/onboarding"
import { SavingsSimulation } from "@/components/savings-simulation"
import { RateBooster } from "@/components/rate-booster"
import { AIAdvisorStandalone } from "@/components/ai-advisor-standalone"
import { SettingsDrawer } from "@/components/settings-drawer"
import { AddMoneyFlow } from "@/components/add-money-flow"
import { ScanDrawer } from "@/components/scan-drawer"
import { OracleSearch } from "@/components/oracle-search"
import { StrategyDetail } from "@/components/strategy-detail"
import { InvestFlow } from "@/components/invest-flow"
import {
  ArrowUpRight,
  Plus,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  Menu,
  Zap,
  Globe,
  Cpu,
  Building,
  Bitcoin,
  Rocket,
  ScanLine,
  Target,
  Trophy,
  PartyPopper,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const STRATEGIES = [
  {
    id: "us-broad",
    name: "US Broad Market",
    description: "S&P 500 • Total Market",
    riskLevel: "Beginner-friendly",
    badgeColor: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: TrendingUp,
    color: "#22c55e", // green-500
    assets: [
      { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", price: 510.25, change: 0.45, allocation: 40 },
      { symbol: "VTI", name: "Vanguard Total Stock Market", price: 260.1, change: 0.32, allocation: 30 },
      { symbol: "VOO", name: "Vanguard S&P 500 ETF", price: 470.5, change: 0.44, allocation: 20 },
      { symbol: "IVV", name: "iShares Core S&P 500", price: 512.15, change: 0.42, allocation: 10 },
    ],
  },
  {
    id: "ai-tech",
    name: "AI & Tech",
    description: "Magnificent 7",
    riskLevel: "Growth",
    badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Cpu,
    color: "#3b82f6", // blue-500
    assets: [
      { symbol: "NVDA", name: "NVIDIA Corporation", price: 890.5, change: 2.5, allocation: 20 },
      { symbol: "MSFT", name: "Microsoft Corporation", price: 405.15, change: 0.85, allocation: 15 },
      { symbol: "AAPL", name: "Apple Inc.", price: 172.75, change: 0.5, allocation: 15 },
      { symbol: "GOOGL", name: "Alphabet Inc.", price: 155.3, change: 1.1, allocation: 15 },
      { symbol: "AMZN", name: "Amazon.com Inc.", price: 180.1, change: 1.4, allocation: 15 },
      { symbol: "META", name: "Meta Platforms", price: 495.2, change: 1.8, allocation: 10 },
      { symbol: "TSLA", name: "Tesla, Inc.", price: 175.4, change: -0.5, allocation: 10 },
    ],
  },
  {
    id: "real-estate",
    name: "Real Estate",
    description: "US REITs (O) • Syndications",
    riskLevel: "Income",
    badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: Building,
    color: "#f59e0b", // amber-500
    assets: [
      { symbol: "O", name: "Realty Income Corp", price: 52.4, change: 0.15, allocation: 30 },
      { symbol: "PLD", name: "Prologis, Inc.", price: 125.6, change: -0.2, allocation: 25 },
      { symbol: "AMT", name: "American Tower Corp", price: 195.3, change: 0.1, allocation: 20 },
      { symbol: "VNQ", name: "Vanguard Real Estate ETF", price: 84.2, change: 0.05, allocation: 15 },
      { symbol: "VICI", name: "VICI Properties Inc.", price: 28.9, change: 0.3, allocation: 10 },
    ],
  },
  {
    id: "chinese-tech",
    name: "Chinese Tech Equity",
    description: "BYD • Alibaba • EV Market",
    riskLevel: "Advanced",
    badgeColor: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    icon: Globe,
    color: "#f97316", // orange-500
    assets: [
      { symbol: "BABA", name: "Alibaba Group", price: 72.5, change: 1.5, allocation: 30 },
      { symbol: "TCEHY", name: "Tencent Holdings", price: 38.4, change: 1.2, allocation: 25 },
      { symbol: "BYDDY", name: "BYD Company Ltd.", price: 55.6, change: 2.1, allocation: 20 },
      { symbol: "JD", name: "JD.com Inc.", price: 26.8, change: 0.9, allocation: 15 },
      { symbol: "PDD", name: "PDD Holdings", price: 115.4, change: 3.5, allocation: 10 },
    ],
  },
  {
    id: "crypto",
    name: "Crypto Blue Chips",
    description: "Bitcoin • Ethereum Fund",
    riskLevel: "High Risk",
    badgeColor: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    icon: Bitcoin,
    color: "#6366f1", // indigo-500
    assets: [
      { symbol: "BTC", name: "Bitcoin", price: 68450.0, change: 1.5, allocation: 45 },
      { symbol: "ETH", name: "Ethereum", price: 3840.25, change: 2.1, allocation: 35 },
      { symbol: "SOL", name: "Solana", price: 145.2, change: 4.5, allocation: 10 },
      { symbol: "LINK", name: "Chainlink", price: 18.45, change: 5.4, allocation: 5 },
      { symbol: "UNI", name: "Uniswap", price: 12.5, change: 1.2, allocation: 5 },
    ],
  },
  {
    id: "venture",
    name: "Venture & Pre-IPO",
    description: "SPACs • Angel Syndications • OpenAI",
    riskLevel: "High Risk",
    badgeColor: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    icon: Rocket,
    color: "#ec4899", // pink-500
    assets: [
      { symbol: "OAI", name: "OpenAI Employee Fund", price: 15000.0, change: 0.0, allocation: 40 },
      { symbol: "STRIPE", name: "Stripe Secondary", price: 24.5, change: 0.1, allocation: 25 },
      { symbol: "SPAC-A", name: "Tech Acquisition Corp", price: 10.05, change: -0.5, allocation: 20 },
      { symbol: "ANDR", name: "Anduril Industries", price: 14.2, change: 0.8, allocation: 15 },
    ],
  },
]

export default function Home() {
  const [currentView, setCurrentView] = useState("home")
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [showSimulation, setShowSimulation] = useState(false)
  const [showRateBooster, setShowRateBooster] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [showInvest, setShowInvest] = useState(false)
  const [showScan, setShowScan] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null)
  const [advisorPrompt, setAdvisorPrompt] = useState("")

  const totalNetWorth = 12240.0 + 6605.23

  const monthlyExpenses = 3000
  const securityGoal = monthlyExpenses * 6 // 6 months
  const freedomGoal = monthlyExpenses * 12 * 25 // 25 years

  const securityProgress = Math.min((totalNetWorth / securityGoal) * 100, 100)
  const freedomProgress = Math.min((totalNetWorth / freedomGoal) * 100, 100)

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />
  }

  if (selectedStrategy) {
    return (
      <>
        <StrategyDetail
          strategy={selectedStrategy}
          onBack={() => setSelectedStrategy(null)}
          onInvest={() => setShowInvest(true)}
        />
        <InvestFlow isOpen={showInvest} onClose={() => setShowInvest(false)} strategy={selectedStrategy} />
        <AddMoneyFlow isOpen={showAddMoney} onClose={() => setShowAddMoney(false)} />
      </>
    )
  }

  return (
    <>
      <main className="flex min-h-screen flex-col bg-background pb-24">
        {currentView === "home" && (
          <>
            {/* Header Section */}
            <header className="px-1.5 pt-3 pb-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2.5 rounded-full hover:bg-secondary transition-colors"
                  >
                    <Menu className="h-7 w-7" />
                  </button>
                  <span className="font-semibold text-xl tracking-tight">Lang</span>
                </div>
                <button
                  onClick={() => setShowScan(true)}
                  className="p-2.5 rounded-full hover:bg-secondary transition-colors relative group"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground border border-border group-hover:border-primary transition-colors">
                    <ScanLine className="h-6 w-6" />
                  </div>
                </button>
              </div>

              <div className="mx-1 mb-6 p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/60 dark:border-amber-800/60 relative overflow-hidden shadow-sm">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-400 font-bold">
                    <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-full">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <span>Financial Security: Achieved!</span>
                  </div>
                  <p className="text-sm text-amber-900/80 dark:text-amber-200/80 mb-3 leading-relaxed">
                    Congrats! You've continued making deposits for the last{" "}
                    <span className="font-semibold">5 months</span> to grow your wealth.
                  </p>
                  <div className="flex items-center gap-2 bg-white/60 dark:bg-black/20 p-2.5 rounded-xl w-fit backdrop-blur-sm">
                    <PartyPopper className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium text-orange-900/80 dark:text-orange-200/80">
                      You made <span className="font-bold text-orange-700 dark:text-orange-300">$1,240.50</span> without
                      working.
                    </span>
                  </div>
                </div>
                <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                  <Trophy className="h-32 w-32 text-amber-500" />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <p className="text-muted-foreground font-medium text-base">Total Balance</p>
                  <h1 className="text-6xl font-bold tracking-tighter">
                    ${totalNetWorth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h1>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-blue-500" />
                      <span className="font-semibold text-base">Financial Security</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(securityProgress)}% of 6 mo. expenses
                    </span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${securityProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Goal: ${securityGoal.toLocaleString()} • You're building a safety net.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-500" />
                      <span className="font-semibold text-base">Financial Freedom</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {freedomProgress.toFixed(1)}% of 25 yrs expenses
                    </span>
                  </div>
                  <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                      style={{ width: `${freedomProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Goal: ${freedomGoal.toLocaleString()} • Long-term independence.
                  </p>
                </div>
              </div>
            </header>

            {/* Chart Section */}
            <section className="w-full mb-8 mt-4">
              <PortfolioChart />
            </section>

            {/* Primary Actions - Add Money prominently featured */}
            <section className="px-6 mb-8">
              <button
                onClick={() => setShowAddMoney(true)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground h-14 rounded-full font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <Plus className="h-5 w-5" />
                Add Money
              </button>
            </section>

            {/* Account Types / Strategies */}
            <section className="px-6 space-y-6">
              <h2 className="text-xl font-semibold tracking-tight">Your Accounts</h2>

              {/* Protected Savings */}
              <button
                onClick={() => setCurrentView("investing")}
                className="w-full text-left group relative overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Protected Savings</h3>
                      <p className="text-sm text-muted-foreground">Protected Yield</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">$12,240.00</p>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[65%] rounded-full" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Backed by US Treasuries • $1M Protection</p>
              </button>

              {/* Growth Portfolio */}
              <button
                onClick={() => setCurrentView("investing")}
                className="w-full text-left group relative overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Growth Portfolio</h3>
                      <p className="text-sm text-muted-foreground">Global Equities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">$6,605.23</p>
                    <p className="text-sm text-success font-medium">+12.4% YTD</p>
                  </div>
                </div>

                {/* Allocation Breakdown */}
                <div className="w-full bg-secondary/30 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">S&P 500 ETF (SPY)</span>
                    <span className="font-medium">60%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tech ETFs</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Emerging Markets</span>
                    <span className="font-medium">15%</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAdvisorPrompt("I need help rebalancing my portfolio. Can you analyze my current allocation?")
                    setCurrentView("advisor")
                  }}
                  className="w-full bg-primary text-primary-foreground h-12 rounded-full font-medium hover:opacity-90 transition-opacity"
                >
                  Rebalance Portfolio
                </button>
              </button>
            </section>

            {/* Holdings Section */}
            <section className="px-6 space-y-4 mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Top Holdings</h2>
                <button className="text-sm text-primary font-medium hover:underline">View All</button>
              </div>

              {/* Holdings List */}
              <div className="space-y-3">
                {/* US Broad Market */}
                <button
                  onClick={() => setSelectedStrategy(STRATEGIES[0])}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">US Broad Market</p>
                      <p className="text-sm text-muted-foreground">S&P 500 • Total Market</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$8,500.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+1.2%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* AI & Tech */}
                <button
                  onClick={() => setSelectedStrategy(STRATEGIES[1])}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">AI & Tech</p>
                      <p className="text-sm text-muted-foreground">Magnificent 7</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$4,200.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+2.4%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Real Estate */}
                <button
                  onClick={() => setSelectedStrategy(STRATEGIES[2])}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Building className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Real Estate</p>
                      <p className="text-sm text-muted-foreground">US REITs • Income</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$3,000.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+0.8%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Crypto Blue Chips */}
                <button
                  onClick={() => setSelectedStrategy(STRATEGIES[4])}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Bitcoin className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Crypto Blue Chips</p>
                      <p className="text-sm text-muted-foreground">Bitcoin • Ethereum</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$2,145.23</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+5.4%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Venture & Pre-IPO */}
                <button
                  onClick={() => setSelectedStrategy(STRATEGIES[5])}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Venture & Pre-IPO</p>
                      <p className="text-sm text-muted-foreground">OpenAI • Stripe</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$1,000.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+15.4%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </section>
          </>
        )}

        {currentView === "investing" && (
          <div className="px-6 pt-12 space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Investing & Saving</h1>
              <p className="text-muted-foreground">Manage your accounts and strategies</p>
            </div>

            {/* Protected Savings Detail */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Protected Savings</h2>
              <div className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Protected Savings</h3>
                      <p className="text-sm text-muted-foreground">Treasury-backed RWA</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">$12,240.00</p>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-sm text-success font-medium">Base: 4.0% APY</p>
                      <button
                        onClick={() => setShowRateBooster(true)}
                        className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-bold hover:bg-success/20 transition-colors flex items-center gap-0.5"
                      >
                        <Zap className="w-3 h-3" />
                        Boost APY
                      </button>
                    </div>
                  </div>
                </div>

                {/* Rate Boosters */}
                <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    Active Boosters
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                      EARNING 6.5%
                    </span>
                  </p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Auto-Saver Enabled</span>
                      <span className="text-success font-medium">+2.0%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Referral Bonus (2 friends)</span>
                      <span className="text-success font-medium">+0.5%</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between text-sm font-semibold">
                      <span>Total APY</span>
                      <span className="text-success">6.5%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowSimulation(true)}
                    className="w-full bg-secondary text-secondary-foreground h-12 rounded-full font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Simulate
                  </button>
                  <button
                    onClick={() => setShowAddMoney(true)}
                    className="w-full bg-primary text-primary-foreground h-12 rounded-full font-medium hover:opacity-90 transition-opacity"
                  >
                    Deposit More
                  </button>
                </div>
              </div>
            </div>

            {/* Growth Portfolio Detail */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Growth Portfolio</h2>
              <div className="rounded-2xl bg-card border border-border p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Growth Portfolio</h3>
                      <p className="text-sm text-muted-foreground">Global Equities</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">$6,605.23</p>
                    <p className="text-sm text-success font-medium">+12.4% YTD</p>
                  </div>
                </div>

                {/* Allocation Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">S&P 500 ETF (SPY)</span>
                    <span className="font-medium">60%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tech ETFs</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Emerging Markets</span>
                    <span className="font-medium">15%</span>
                  </div>
                </div>

                <button className="w-full bg-primary text-primary-foreground h-12 rounded-full font-medium hover:opacity-90 transition-opacity">
                  Rebalance Portfolio
                </button>
              </div>
            </div>
          </div>
        )}

        {currentView === "explore" && (
          <div className="px-6 pt-12 space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Explore</h1>
              <p className="text-muted-foreground">Discover new investment opportunities</p>
            </div>

            <OracleSearch />

            {/* Browse Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {["All", "ETFs", "Stocks", "Curated Strategies", "Crypto"].map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium whitespace-nowrap hover:bg-secondary/80 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Strategies */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Strategies</h2>

              {STRATEGIES.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => setSelectedStrategy(strategy)}
                  className="w-full text-left rounded-xl bg-card border border-border p-4 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center",
                          strategy.badgeColor.replace("text-", "text-opacity-100 text-"), // Simple trick to get similar bg color
                        )}
                      >
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center opacity-20 absolute",
                            strategy.badgeColor.split(" ")[0],
                          )}
                        />
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center relative",
                            strategy.id === "us-broad"
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : strategy.id === "ai-tech"
                                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                : strategy.id === "real-estate"
                                  ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                                  : strategy.id === "chinese-tech"
                                    ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                                    : strategy.id === "crypto"
                                      ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                                      : "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
                          )}
                        >
                          <strategy.icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{strategy.name}</h3>
                        <p className="text-xs text-muted-foreground">{strategy.description}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-medium px-2 py-1 rounded-full", strategy.badgeColor)}>
                      {strategy.riskLevel}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentView === "advisor" && <AIAdvisorStandalone initialPrompt={advisorPrompt} />}

        {currentView === "settings" && (
          <div className="px-6 pt-12 space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
              <p className="text-muted-foreground">Manage your profile and preferences</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="h-16 w-16 rounded-full bg-muted border-2 border-background overflow-hidden">
                  <img src="/diverse-avatars.png" alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">Lang</h2>
                  <p className="text-sm text-muted-foreground">lang@example.com</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Account</h3>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Personal Information</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Payment Methods</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Notifications</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider ml-1">Security</h3>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Privacy & Security</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Menu className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Help & Support</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <button
                onClick={() => setShowOnboarding(true)}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-destructive font-medium hover:bg-destructive/10 transition-colors mt-4"
              >
                <Menu className="h-5 w-5" />
                Log Out
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav activeTab={currentView} onTabChange={setCurrentView} />

      <SettingsDrawer isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <SavingsSimulation isOpen={showSimulation} onClose={() => setShowSimulation(false)} />
      <RateBooster isOpen={showRateBooster} onClose={() => setShowRateBooster(false)} />
      <AddMoneyFlow isOpen={showAddMoney} onClose={() => setShowAddMoney(false)} />
      <ScanDrawer isOpen={showScan} onClose={() => setShowScan(false)} />
    </>
  )
}
