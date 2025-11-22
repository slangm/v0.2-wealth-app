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
} from "lucide-react"
import { useState } from "react"

export default function Home() {
  const [currentView, setCurrentView] = useState("home")
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [showSimulation, setShowSimulation] = useState(false)
  const [showRateBooster, setShowRateBooster] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [showScan, setShowScan] = useState(false)

  const totalNetWorth = 8240.0 + 4605.23

  const monthlyExpenses = 3000
  const securityGoal = monthlyExpenses * 6 // 6 months
  const freedomGoal = monthlyExpenses * 12 * 25 // 25 years

  const securityProgress = Math.min((totalNetWorth / securityGoal) * 100, 100)
  const freedomProgress = Math.min((totalNetWorth / freedomGoal) * 100, 100)

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />
  }

  return (
    <>
      <main className="flex min-h-screen flex-col bg-background pb-24">
        {currentView === "home" && (
          <>
            {/* Header Section */}
            <header className="px-1.5 pt-3 pb-1">
              <div className="flex items-center justify-between mb-8">
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
                    <p className="font-bold">$8,240.00</p>
                    <p className="text-muted-foreground">Today</p>
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
                    <p className="font-bold">$4,605.23</p>
                    <p className="text-muted-foreground">Today</p>
                  </div>
                </div>
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full w-[35%] rounded-full" />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">S&P 500 • Tech ETFs • Emerging Markets</p>
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
                {/* SPY */}
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                      SPY
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">S&P 500 ETF</p>
                      <p className="text-sm text-muted-foreground">SPY • 45 shares</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$22,450.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+1.2%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Ethereum */}
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                      >
                        <path d="M12 2L2 12l10 10 10-10L12 2z" />
                        <path d="M2 12l10 5 10-5" />
                        <path d="M12 2v20" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Ethereum</p>
                      <p className="text-sm text-muted-foreground">ETH • 12.5 ETH</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$38,240.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+4.5%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Bitcoin */}
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                      >
                        <path d="M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042l-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893l-3.94-.694m5.155-6.2L8.279 5.307m2.175 3.057l-.347 1.97M7.589 20.338l.347-1.97m0 0l-.597-3.394m0 0l-.347-1.97m0 0l-2.175-3.057m16.448 11.718l-3.662-2.098" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">Bitcoin</p>
                      <p className="text-sm text-muted-foreground">BTC • 0.45 BTC</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$28,450.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+2.1%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* OpenAI */}
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-white font-bold text-xs">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">OpenAI Fund</p>
                      <p className="text-sm text-muted-foreground">Pre-IPO • Equity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$15,000.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+15.4%</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>

                {/* Apple */}
                <button className="w-full flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white font-bold text-sm">
                      A
                    </div>
                    <div>
                      <p className="font-semibold">Apple Inc.</p>
                      <p className="text-sm text-muted-foreground">AAPL • 12 shares</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">$2,184.00</p>
                      <div className="flex items-center gap-1 text-success text-sm font-medium">
                        <ArrowUpRight className="h-3 w-3" />
                        <span>+2.4%</span>
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
                    <p className="text-2xl font-bold">$8,240.00</p>
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
                  <button className="w-full bg-primary text-primary-foreground h-12 rounded-full font-medium hover:opacity-90 transition-opacity">
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
                    <p className="text-2xl font-bold">$4,605.23</p>
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

              {/* US Broad Market */}
              <button className="w-full text-left rounded-xl bg-card border border-border p-4 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">US Broad Market</h3>
                      <p className="text-xs text-muted-foreground">S&P 500 • Total Market</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                    Beginner-friendly
                  </span>
                </div>
              </button>

              {/* AI & Tech */}
              <button className="w-full text-left rounded-xl bg-card border border-border p-4 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">AI & Tech</h3>
                      <p className="text-xs text-muted-foreground">Mag 7 • Pre-IPO AI • Semiconductors</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                    Growth
                  </span>
                </div>
              </button>

              {/* Real Estate */}
              <button className="w-full text-left rounded-xl bg-card border border-border p-4 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">Real Estate</h3>
                      <p className="text-xs text-muted-foreground">US REITs (O) • Syndications</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
                    Income
                  </span>
                </div>
              </button>

              {/* Chinese Tech Equity */}
              <button className="w-full text-left rounded-xl bg-card border border-border p-4 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">Chinese Tech Equity</h3>
                      <p className="text-xs text-muted-foreground">BYD • Alibaba • EV Market</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded-full">
                    Advanced
                  </span>
                </div>
              </button>

              {/* Crypto Blue Chips */}
              <button className="w-full text-left rounded-xl bg-card border border-border p-4 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Bitcoin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">Crypto Blue Chips</h3>
                      <p className="text-xs text-muted-foreground">Bitcoin • Ethereum Fund</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded-full">
                    High Risk
                  </span>
                </div>
              </button>

              {/* Venture & Pre-IPO */}
              <button className="w-full text-left rounded-xl bg-card border border-border p-4 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold group-hover:text-primary transition-colors">Venture & Pre-IPO</h3>
                      <p className="text-xs text-muted-foreground">SPACs • Angel Syndications • OpenAI</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 px-2 py-1 rounded-full">
                    High Risk
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {currentView === "advisor" && <AIAdvisorStandalone />}

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
