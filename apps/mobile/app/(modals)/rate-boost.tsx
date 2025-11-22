import { ScrollView, View, Text } from "react-native"
import { usePortfolioStore } from "../../src/store/portfolio"
import { BoostList } from "../../src/components/BoostList"

export default function RateBoostModal() {
  const { boosts } = usePortfolioStore()
  const totalBoost = boosts.reduce((sum, boost) => (boost.active ? sum + boost.delta : sum), 0)

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-white text-2xl font-semibold">Boost your Protected Savings APY</Text>
      <Text className="text-white/70 mt-2">Complete simple actions each month to climb toward 8%+ APY.</Text>

      <View className="bg-white/5 rounded-3xl p-4 mt-5">
        <Text className="text-white/70 text-sm">Current APY</Text>
        <Text className="text-white text-4xl font-bold mt-1">{(4 + totalBoost).toFixed(2)}%</Text>
        <Text className="text-emerald-400 text-sm mt-1">Base 4.00% + {totalBoost.toFixed(2)}% boosters</Text>
      </View>

      <BoostList boosts={boosts} />
    </ScrollView>
  )
}

