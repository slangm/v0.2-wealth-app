import { View, Text } from "react-native"
import { Holding } from "../store/portfolio"

type Props = {
  holding: Holding
}

export function HoldingRow({ holding }: Props) {
  return (
    <View className="flex-row items-center justify-between py-3">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 rounded-full bg-white/10 items-center justify-center">
          <Text className="text-white font-semibold">{holding.symbol.slice(0, 3)}</Text>
        </View>
        <View>
          <Text className="text-white font-semibold">{holding.name}</Text>
          <Text className="text-xs text-white/60">
            {holding.symbol} • {(holding.allocationPct * 100).toFixed(0)}%
          </Text>
        </View>
      </View>
      <View className="items-end">
        <Text className="text-white font-semibold">
          $
          {holding.value.toLocaleString("en-US", {
            maximumFractionDigits: 0,
          })}
        </Text>
        <Text className="text-xs font-semibold" style={{ color: holding.dayChangePct >= 0 ? "#22c55e" : "#f87171" }}>
          {holding.dayChangePct >= 0 ? "+" : ""}
          {holding.dayChangePct.toFixed(1)}%
        </Text>
      </View>
    </View>
  )
}

