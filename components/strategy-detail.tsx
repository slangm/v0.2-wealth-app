"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, TrendingUp, TrendingDown, ShieldCheck, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

type Asset = {
  symbol: string
  name: string
  price: number
  change: number
  allocation: number
}

type StrategyData = {
  id: string
  name: string
  description: string
  riskLevel: string
  badgeColor: string
  icon: any
  color: string
  assets: Asset[]
}

const generateChartData = (baseValue: number, volatility: number) => {
  let currentValue = baseValue
  return Array.from({ length: 20 }, (_, i) => {
    const change = (Math.random() - 0.45) * volatility
    currentValue = currentValue * (1 + change)
    return { time: i, value: currentValue }
  })
}

export function StrategyDetail({
  strategy,
  onBack,
  onInvest,
}: { strategy: StrategyData; onBack: () => void; onInvest: () => void }) {
  const [assets, setAssets] = useState<Asset[]>(strategy.assets)
  const [chartData, setChartData] = useState(generateChartData(10000, 0.02))

  // Simulate live price updates for assets
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets((current) =>
        current.map((asset) => ({
          ...asset,
          price: asset.price * (1 + (Math.random() * 0.004 - 0.002)), // +/- 0.2% fluctuation
          change: asset.change + (Math.random() * 0.1 - 0.05),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Simulate chart updates
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((current) => {
        const lastValue = current[current.length - 1].value
        const newValue = lastValue * (1 + (Math.random() * 0.004 - 0.001)) // Slight upward trend
        return [...current.slice(1), { time: current[current.length - 1].time + 1, value: newValue }]
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const totalChange = assets.reduce((acc, asset) => acc + asset.change * (asset.allocation / 100), 0)

  return (
    <div className="min-h-screen bg-background animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="font-bold text-xl leading-none">{strategy.name}</h1>
            <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Performance Card */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="p-6 pb-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Live Performance</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-bold">
                    {totalChange >= 0 ? "+" : ""}
                    {totalChange.toFixed(2)}%
                  </span>
                  <span className="text-sm text-muted-foreground">Today</span>
                </div>
              </div>
              <div className={cn("px-2.5 py-1 rounded-full text-xs font-bold", strategy.badgeColor)}>
                {strategy.riskLevel}
              </div>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strategy.color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={strategy.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["auto", "auto"]} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={strategy.color}
                  strokeWidth={2}
                  fill="url(#chartColor)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/30 rounded-xl p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Assets</p>
            <p className="font-semibold">{assets.length} Holdings</p>
          </div>
          <div className="bg-secondary/30 rounded-xl p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Yield</p>
            <p className="font-semibold text-success">{(Math.random() * 2 + 1).toFixed(2)}% Div. Yield</p>
          </div>
        </div>

        {/* Assets List */}
        <div>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <strategy.icon className={cn("h-5 w-5", strategy.color.replace("bg-", "text-").replace("500", "600"))} />
            Underlying Assets
          </h3>
          <div className="space-y-3">
            {assets.map((asset) => (
              <div
                key={asset.symbol}
                className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
                    {asset.symbol.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{asset.symbol}</p>
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">
                        {asset.allocation}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{asset.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-medium text-sm">
                    ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <div
                    className={cn(
                      "flex items-center justify-end gap-1 text-xs font-medium",
                      asset.change >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {asset.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(asset.change).toFixed(2)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="sticky bottom-6 pt-4">
          <button
            onClick={onInvest}
            className="w-full bg-primary text-primary-foreground h-14 rounded-full font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
          >
            <Zap className="h-5 w-5" />
            Invest in Strategy
          </button>
          <p className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            professionally managed • auto-rebalancing
          </p>
        </div>
      </div>
    </div>
  )
}
