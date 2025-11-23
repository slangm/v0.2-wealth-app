"use client"

import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useState } from "react"
import { cn } from "@/lib/utils"

const data = [
  { time: "9:30", value: 18400 },
  { time: "10:00", value: 18450 },
  { time: "10:30", value: 18420 },
  { time: "11:00", value: 18480 },
  { time: "11:30", value: 18550 },
  { time: "12:00", value: 18520 },
  { time: "12:30", value: 18580 },
  { time: "13:00", value: 18650 },
  { time: "13:30", value: 18620 },
  { time: "14:00", value: 18700 },
  { time: "14:30", value: 18750 },
  { time: "15:00", value: 18820 },
  { time: "15:30", value: 18800 },
  { time: "16:00", value: 18845.23 },
]

const timeRanges = ["1M", "3M", "YTD", "1Y", "ALL"]

export function PortfolioChart() {
  const [activeRange, setActiveRange] = useState("YTD")
  const isPositive = true // This would be dynamic based on data

  return (
    <div className="w-full space-y-4">
      <div className="h-[240px] w-full -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide axisLine={false} tickLine={false} />
            <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--success)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between px-4">
        {timeRanges.map((range) => (
          <button
            key={range}
            onClick={() => setActiveRange(range)}
            className={cn(
              "text-sm font-medium transition-colors px-3 py-1 rounded-full",
              activeRange === range ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {range}
          </button>
        ))}
      </div>
    </div>
  )
}
