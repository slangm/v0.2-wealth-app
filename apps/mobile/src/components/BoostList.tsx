import { View, Text } from "react-native"
import { BoostAction } from "../store/portfolio"

type Props = {
  boosts: BoostAction[]
}

export function BoostList({ boosts }: Props) {
  return (
    <View className="mt-3 space-y-2">
      {boosts.map((boost) => (
        <View key={boost.id} className="flex-row justify-between items-center py-2 border-b border-white/5">
          <View className="flex-1 pr-2">
            <Text className="text-white font-semibold">{boost.label}</Text>
            <Text className="text-xs text-white/60">{boost.description}</Text>
          </View>
          <View className="px-2 py-1 rounded-full" style={{ backgroundColor: boost.active ? "#22c55e22" : "#ffffff11" }}>
            <Text className="text-sm font-semibold" style={{ color: boost.active ? "#22c55e" : "#94a3b8" }}>
              +{boost.delta.toFixed(2)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  )
}

