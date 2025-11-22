import { useState } from "react"
import { ScrollView, View, Text, Pressable } from "react-native"
import { useMutation } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { usePortfolioStore } from "../../src/store/portfolio"
import { recordAllocation } from "../../src/services/portfolio"
import { formatFiat } from "@globalwealth/ui"
import { useQuery } from "@tanstack/react-query"
import { fetchBeefyVaults, mockBeefyDeposit } from "../../src/services/beefy"
import { usePrivySession } from "../../src/hooks/usePrivySession"

export default function InvestScreen() {
  const { strategies, securityBalance, growthBalance, recordAllocation: mutateLocal } = usePortfolioStore()
  const [pendingTarget, setPendingTarget] = useState<"protected" | "growth">("protected")
  const session = usePrivySession()
  const token = session.status === "authenticated" ? session.user.accessToken : undefined

  const { data: beefyVaults } = useQuery({
    queryKey: ["beefy-vaults"],
    queryFn: () => fetchBeefyVaults(token),
  })

  async function handleBeefyDeposit(vaultId: string, amount = 100) {
    try {
      const resp = await mockBeefyDeposit(vaultId, amount, token)
      Toast.show({
        type: "success",
        text1: "Growth deposit queued",
        text2: `Vault ${vaultId} mock tx ${resp.txHash ?? "pending"}`,
      })
    } catch (error) {
      console.warn("Beefy deposit failed", error)
      Toast.show({ type: "error", text1: "Deposit failed", text2: "Check token or amount (≤ $500)" })
    }
  }

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

      <View className="bg-white/5 rounded-3xl p-5 mt-6">
        <Text className="text-white text-lg font-semibold mb-2">AI Growth Plan (Polygon)</Text>
        <Text className="text-white/70 text-sm mb-3">
          AI 仅可在以下 3 个 Beefy vault 间分配，总额 ≤ $500/笔。
        </Text>
        {(beefyVaults ?? []).map((vault) => (
          <View key={vault.id} className="py-3 border-b border-white/10">
            <View className="flex-row justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-white font-semibold">{vault.name}</Text>
                <Text className="text-white/60 text-xs">
                  {vault.chain} • Token: {vault.token} • APY: {vault.apy ? `${(vault.apy * 100).toFixed(2)}%` : "n/a"}
                </Text>
                <Text className="text-white/60 text-xs">
                  Contract: {vault.earnContractAddress.slice(0, 6)}...{vault.earnContractAddress.slice(-4)}
                </Text>
              </View>
              <Pressable
                onPress={() => handleBeefyDeposit(vault.id, 100)}
                className="px-3 py-2 bg-primary rounded-full self-center"
              >
                <Text className="text-white text-xs font-semibold">Mock $100</Text>
              </Pressable>
            </View>
          </View>
        ))}
        <Text className="text-white/60 text-xs mt-3">
          提示：在 Advisor 聊天中让 AI 推荐比例（低/中/高），我们仅接受上述 vault，单笔 ≤ $500。
        </Text>
      </View>
    </ScrollView>
  )
}
