import { ReactNode } from "react"
import { View, Text } from "react-native"
import { palette } from "@globalwealth/ui"

type Props = {
  title: string
  subtitle: string
  value: string
  right?: ReactNode
  footer?: ReactNode
  accentColor: string
}

export function AccountCard({ title, subtitle, value, right, footer, accentColor }: Props) {
  return (
    <View className="w-full rounded-3xl p-5 mb-4" style={{ backgroundColor: palette.surface }}>
      <View className="flex-row justify-between items-start">
        <View>
          <Text className="text-base text-white/80">{subtitle}</Text>
          <Text className="text-2xl font-semibold text-white">{title}</Text>
        </View>
        <View className="items-end">{right}</View>
      </View>
      <View className="flex-row justify-between items-center mt-4">
        <Text className="text-3xl font-bold text-white">{value}</Text>
        <View style={{ backgroundColor: `${accentColor}33` }} className="px-3 py-1 rounded-full">
          <Text style={{ color: accentColor }} className="font-semibold text-xs uppercase">
            {subtitle}
          </Text>
        </View>
      </View>
      {footer ? <View className="mt-4">{footer}</View> : null}
    </View>
  )
}

