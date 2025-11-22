import { View, Text, ScrollView, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQuery } from "@tanstack/react-query"
import { fetchFundingOptions, initiateDeposit } from "../../src/services/payments"

export default function AddMoneyModal() {
  const router = useRouter()
  const { data: options = [] } = useQuery({ queryKey: ["funding-options"], queryFn: fetchFundingOptions })
  const mutation = useMutation({ mutationFn: initiateDeposit, onSuccess: () => router.back() })

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Text className="text-white text-2xl font-semibold">Add Money</Text>
      <Text className="text-white/70 mt-2">Select a deposit rail that works in your region.</Text>
      {options.map((option) => (
        <Pressable
          key={option.id}
          onPress={() => mutation.mutate({ amount: 250, optionId: option.id })}
          className="mt-4 bg-white/5 rounded-3xl p-5 border border-white/10"
        >
          <Text className="text-white text-xl font-semibold">{option.label}</Text>
          <Text className="text-white/60 text-sm mt-1">{option.description}</Text>
          <View className="flex-row justify-between mt-3">
            <Text className="text-white/60 text-xs">Speed: {option.speed}</Text>
            <Text className="text-white/60 text-xs">Fees: {option.fees}</Text>
          </View>
          <Text className="text-white/50 text-xs mt-2">Regions: {option.regionTags.join(", ")}</Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

