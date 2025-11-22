import { useState } from "react"
import { ScrollView, View, Text, Pressable } from "react-native"
import { useMutation } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { usePortfolioStore } from "../../src/store/portfolio"
import { recordAllocation } from "../../src/services/portfolio"
import { formatFiat } from "@globalwealth/ui"

export default function InvestScreen() {
  const { strategies, securityBalance, growthBalance, recordAllocation: mutateLocal } = usePortfolioStore()
  const [pendingTarget, setPendingTarget] = useState<"protected" | "growth">("protected")

  const mutation = useMutation({
    mutationFn: recordAllocation,
    onSuccess: ({ amount, target, strategyId }) => {
      mutateLocal({ strategyId, delta: amount, target })
      Toast.show({ type: "success", text1: "Allocation updated", text2: `Moved ${formatFiat(amount)} into ${target}` })
    },
  })

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      {strategies.map((strategy) => (
        <View key={strategy.id} className="bg-white/5 rounded-3xl p-5 mb-6">
          <Text className="text-white text-xl font-semibold">{strategy.label}</Text>
          <Text className="text-white/70 text-sm mt-1">
            {strategy.flavor === "protected" ? "Treasury-backed yield" : "Global equities blend"}
          </Text>
          <Text className="text-emerald-400 font-semibold text-2xl mt-3">{strategy.apy.toFixed(1)}% Target</Text>
          <View className="mt-4 space-y-2">
            {strategy.breakdown.map((item) => (
              <View key={item.label} className="flex-row justify-between">
                <Text className="text-white/70">{item.label}</Text>
                <Text className="text-white font-semibold">{item.value}%</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <View className="bg-white/5 rounded-3xl p-5">
        <Text className="text-white text-lg font-semibold mb-2">Move funds</Text>
        <Text className="text-white/70 text-sm mb-4">
          Rebalance between security ({formatFiat(securityBalance)}) and growth ({formatFiat(growthBalance)}).
        </Text>
        <View className="flex-row gap-2">
          <Pressable
            onPress={() => setPendingTarget("protected")}
            className={`flex-1 rounded-full py-3 items-center border ${pendingTarget === "protected" ? "bg-primary border-primary" : "border-white/20"}`}
          >
            <Text className="text-white font-semibold">Protected</Text>
          </Pressable>
          <Pressable
            onPress={() => setPendingTarget("growth")}
            className={`flex-1 rounded-full py-3 items-center border ${pendingTarget === "growth" ? "bg-primary border-primary" : "border-white/20"}`}
          >
            <Text className="text-white font-semibold">Growth</Text>
          </Pressable>
        </View>
        <Pressable
          disabled={mutation.isPending}
          onPress={() =>
            mutation.mutate({
              strategyId: pendingTarget === "protected" ? "protected" : "growth",
              amount: 250,
              target: pendingTarget,
            })
          }
          className="mt-4 bg-emerald-500 rounded-full py-3 items-center"
        >
          <Text className="text-white font-semibold">{mutation.isPending ? "Routing..." : "Allocate $250"}</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

