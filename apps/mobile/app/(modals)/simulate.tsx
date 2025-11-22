import { useState, useMemo } from "react"
import { View, Text, Pressable } from "react-native"
import { simulateProjection } from "../../src/services/portfolio"

export default function SimulateModal() {
  const [monthly, setMonthly] = useState(400)
  const [years, setYears] = useState(5)
  const [history, setHistory] = useState<{ month: number; balance: number }[]>([])

  const projection = useMemo(() => (history.length > 0 ? history[history.length - 1].balance : 0), [history])

  async function runSimulation() {
    const result = await simulateProjection({ monthlyContribution: monthly, years, baseRate: 6.5 })
    setHistory(result)
  }

  return (
    <View className="flex-1 bg-background p-6 justify-between">
      <View>
        <Text className="text-white text-2xl font-semibold">Savings Simulator</Text>
        <Text className="text-white/70 mt-2">
          Explore how recurring deposits plus boosters accelerate your path to 6 months of security.
        </Text>

        <Text className="text-white mt-6">Monthly Contribution: ${monthly}</Text>
        <View className="flex-row gap-3 mt-2">
          {[200, 400, 600, 800, 1000].map((value) => (
            <Pressable
              key={value}
              onPress={() => setMonthly(value)}
              className={`px-4 py-2 rounded-full ${monthly === value ? "bg-primary" : "bg-white/10"}`}
            >
              <Text className="text-white font-semibold">${value}</Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-white mt-6">Time Horizon</Text>
        <View className="flex-row gap-3 mt-2">
          {[3, 5, 7, 10].map((value) => (
            <Pressable
              key={value}
              onPress={() => setYears(value)}
              className={`px-3 py-2 rounded-full ${years === value ? "bg-primary" : "bg-white/10"}`}
            >
              <Text className="text-white font-semibold">{value}y</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={runSimulation} className="bg-primary rounded-full py-3 items-center mt-6">
          <Text className="text-white font-semibold">Run simulation</Text>
        </Pressable>
      </View>

      <View className="bg-white/5 rounded-3xl p-4 mt-6">
        <Text className="text-white/70 text-sm">Projected balance</Text>
        <Text className="text-white text-4xl font-bold mt-2">${projection.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
        <Text className="text-white/60 mt-2">
          Based on base APY 4% + boosters 2.5%, auto-saving ${monthly} for {years} years.
        </Text>
      </View>
    </View>
  )
}

