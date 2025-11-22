import { useEffect } from "react"
import { ScrollView, View, Text, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { ShieldCheck, TrendingUp, Zap } from "lucide-react-native"
import { calculateLadderProgress, formatFiat } from "@globalwealth/ui"

import { fetchPortfolioSnapshot, fetchBoosts, getLadderCopy } from "../../src/services/portfolio"
import type { PortfolioSnapshot } from "../../src/services/portfolio"
import { usePortfolioStore } from "../../src/store/portfolio"
import type { BoostAction } from "../../src/store/portfolio"
import { ProgressBar } from "../../src/components/ProgressBar"
import { HoldingRow } from "../../src/components/HoldingRow"
import { BoostList } from "../../src/components/BoostList"
import { NudgeCard } from "../../src/components/NudgeCard"

export default function HomeScreen() {
  const router = useRouter()
  const { securityBalance, growthBalance, monthlyExpenses, holdings, boosts, updateSnapshot, setBoosts } =
    usePortfolioStore()

  const { data: snapshot } = useQuery<PortfolioSnapshot>({
    queryKey: ["portfolio"],
    queryFn: fetchPortfolioSnapshot,
    staleTime: 1000 * 30,
  })

  const { data: boostData } = useQuery<BoostAction[]>({
    queryKey: ["boosts"],
    queryFn: fetchBoosts,
  })

  useEffect(() => {
    if (snapshot) {
      updateSnapshot({
        securityBalance: snapshot.securityBalance,
        growthBalance: snapshot.growthBalance,
        holdings: snapshot.holdings,
      })
    }
  }, [snapshot, updateSnapshot])

  useEffect(() => {
    if (boostData) {
      setBoosts(boostData)
    }
  }, [boostData, setBoosts])

  const totalNetWorth = securityBalance + growthBalance
  const ladder = calculateLadderProgress({ totalNetWorth, monthlyExpenses })
  const nudgeCopy = getLadderCopy(totalNetWorth, monthlyExpenses)

  async function handleSafeDeposit() {
    try {
      const resp = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL ?? ""}/portfolio/safe/deposit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 100 }),
      })
      if (resp.ok) {
        Toast.show({ type: "success", text1: "Safe deposit queued", text2: "Sent 90% to Aave, 10% kept liquid." })
      } else {
        Toast.show({ type: "error", text1: "Safe deposit failed" })
      }
    } catch {
      Toast.show({ type: "error", text1: "Safe deposit failed" })
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <View className="flex-row justify-between items-center mb-6">
        <View>
          <Text className="text-white/70 text-sm">Total balance</Text>
          <Text className="text-4xl font-extrabold text-white mt-2">{formatFiat(totalNetWorth)}</Text>
        </View>
        <Pressable
          onPress={() => router.push("/(modals)/add-money")}
          className="bg-primary px-5 py-3 rounded-full shadow-lg shadow-primary/30"
        >
          <Text className="text-white font-semibold">Add Money</Text>
        </Pressable>
      </View>

      <View className="bg-white/5 rounded-3xl p-4 mb-4">
        <View className="flex-row justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-white font-semibold text-lg flex-row items-center gap-2">
              <ShieldCheck color="#60a5fa" /> Security runway
            </Text>
            <Text className="text-white/70 text-xs mt-2">Goal: {formatFiat(ladder.securityGoal)}</Text>
          </View>
          <Text className="text-white font-semibold">{Math.round(ladder.security)}%</Text>
        </View>
        <View className="mt-3">
          <ProgressBar progress={ladder.security} color="#3b82f6" />
        </View>
      </View>

      <View className="bg-white/5 rounded-3xl p-4 mb-6">
        <View className="flex-row justify-between">
          <View className="flex-1 pr-2">
            <Text className="text-white font-semibold text-lg flex-row items-center gap-2">
              <TrendingUp color="#c084fc" /> Freedom runway
            </Text>
            <Text className="text-white/70 text-xs mt-2">Goal: {formatFiat(ladder.freedomGoal)}</Text>
          </View>
          <Text className="text-white font-semibold">{ladder.freedom.toFixed(1)}%</Text>
        </View>
        <View className="mt-3">
          <ProgressBar progress={ladder.freedom} color="#a855f7" />
        </View>
      </View>

      <NudgeCard
        title={nudgeCopy.headline}
        body={nudgeCopy.body}
        action={
          <Pressable
            onPress={() => router.push("/(modals)/rate-boost")}
            className="flex-row items-center gap-2 bg-white/15 rounded-full px-4 py-2"
          >
            <Zap size={16} color="#fde047" />
            <Text className="text-white font-semibold text-sm">View boosters</Text>
          </Pressable>
        }
      />

      <View className="mt-6">
        <Text className="text-white text-xl font-semibold mb-3">Protected Savings</Text>
        <View className="bg-white/5 rounded-3xl p-4">
          <View className="flex-row justify-between">
            <View>
              <Text className="text-white/70 text-sm">Balance</Text>
              <Text className="text-white text-2xl font-bold mt-1">{formatFiat(securityBalance)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-white/70 text-sm">Earning</Text>
              <Text className="text-emerald-400 font-semibold text-lg">6.5% APY</Text>
            </View>
          </View>
          <BoostList boosts={boosts} />
        <View className="flex-row gap-3 mt-4">
          <Pressable
            onPress={() => router.push("/(modals)/simulate")}
            className="flex-1 border border-white/10 rounded-full py-3 items-center"
          >
            <Text className="text-white font-semibold">Simulate</Text>
          </Pressable>
          <Pressable
            onPress={handleSafeDeposit}
            className="flex-1 bg-primary rounded-full py-3 items-center"
          >
            <Text className="text-white font-semibold">Deposit</Text>
          </Pressable>
        </View>
      </View>
      </View>

      <View className="mt-8">
        <Text className="text-white text-xl font-semibold mb-3">Growth Portfolio</Text>
        <View className="bg-white/5 rounded-3xl p-4">
          <View className="flex-row justify-between">
            <View>
              <Text className="text-white/70 text-sm">Balance</Text>
              <Text className="text-white text-2xl font-bold mt-1">{formatFiat(growthBalance)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-white/70 text-sm">Performance</Text>
              <Text className="text-emerald-400 font-semibold text-lg">+12.4% YTD</Text>
            </View>
          </View>
          <View className="mt-3 border-t border-white/10" />
          {holdings.map((holding) => (
            <HoldingRow holding={holding} key={holding.id} />
          ))}
          <Pressable
            onPress={() => router.push("/(tabs)/invest")}
            className="mt-4 border border-white/10 rounded-full py-3 items-center"
          >
            <Text className="text-white font-semibold">Manage allocation</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}
