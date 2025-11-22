"use client"

import { useState, useMemo } from "react"
import { X, Minus, Plus } from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, Cell } from "recharts"

interface SavingsSimulationProps {
  isOpen: boolean
  onClose: () => void
}

export function SavingsSimulation({ isOpen, onClose }: SavingsSimulationProps) {
  const [monthlyContribution, setMonthlyContribution] = useState(500)
  const [referrals, setReferrals] = useState(1)
  const [years, setYears] = useState(30)
  const [showControls, setShowControls] = useState(false)

  const baseAPY = 0.06 // 6.0% base
  const referralBonus = 0.0025 // 0.25% per referral
  const totalAPY = baseAPY + referrals * referralBonus

  const data = useMemo(() => {
    const result = []
    let currentBalance = 0
    const yearlyContribution = monthlyContribution * 12

    for (let i = 1; i <= years; i++) {
      currentBalance = (currentBalance + yearlyContribution) * (1 + totalAPY)
      result.push({
        year: i,
        balance: Math.round(currentBalance),
      })
    }
    return result
  }, [monthlyContribution, years, totalAPY])

  const finalBalance = data[data.length - 1]?.balance || 0
  const totalContributed = monthlyContribution * 12 * years
  const totalEarned = finalBalance - totalContributed

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-6">
        <button
          onClick={() => {
            setMonthlyContribution(500)
            setReferrals(1)
            setYears(30)
          }}
          className="px-4 py-2 rounded-full bg-muted/20 text-sm font-medium hover:bg-muted/30 transition-colors"
        >
          Reset
        </button>
        <button onClick={onClose} className="p-2 rounded-full bg-muted/20 hover:bg-muted/30 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-4 overflow-y-auto">
        <div className="text-center space-y-1 mb-8">
          <p className="text-muted-foreground font-medium">{(totalAPY * 100).toFixed(2)}% APY</p>
          <h1 className="text-5xl font-bold tracking-tight text-success">${finalBalance.toLocaleString()}</h1>
          <p className="text-muted-foreground">
            <span className="text-foreground font-medium">${totalEarned.toLocaleString()} Earned</span> in {years} Years
          </p>
        </div>

        {/* Chart */}
        <div className="flex-1 w-full min-h-[200px] relative mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <Bar dataKey="balance" radius={[2, 2, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(145, 65%, ${40 + (index / years) * 20}%)`} // Green gradient
                    className="opacity-80 hover:opacity-100 transition-opacity"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Y-Axis Labels (Custom overlay) */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-muted-foreground pointer-events-none py-2">
            <span>${(finalBalance / 1000).toFixed(0)}k</span>
            <span>${((finalBalance * 0.75) / 1000).toFixed(0)}k</span>
            <span>${((finalBalance * 0.5) / 1000).toFixed(0)}k</span>
            <span>${((finalBalance * 0.25) / 1000).toFixed(0)}k</span>
            <span>$0</span>
          </div>

          <div className="absolute bottom-[-20px] left-0 right-0 flex justify-between text-xs text-muted-foreground">
            <span>1Y</span>
            <span>Future Projection</span>
            <span>{years}Y</span>
          </div>
        </div>

        {/* Referral Control */}
        <div className="flex items-center justify-center gap-6 my-8">
          <button
            onClick={() => setReferrals(Math.max(0, referrals - 1))}
            className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors"
          >
            <Minus className="w-6 h-6" />
          </button>

          <div className="text-center">
            <p className="text-lg font-semibold">
              {referrals} Referral{referrals !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              {/* Referral control logic can be added here */}
            </div>
          </div>

          <button
            onClick={() => setReferrals(referrals + 1)}
            className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center hover:bg-muted/30 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
