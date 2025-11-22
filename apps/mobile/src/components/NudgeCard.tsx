import { ReactNode } from "react"
import { View, Text } from "react-native"

type Props = {
  title: string
  body: string
  action?: ReactNode
}

export function NudgeCard({ title, body, action }: Props) {
  return (
    <View className="w-full rounded-3xl p-4 mt-4" style={{ backgroundColor: "rgba(76, 123, 255, 0.1)" }}>
      <Text className="text-white font-semibold text-lg">{title}</Text>
      <Text className="text-white/80 mt-2">{body}</Text>
      {action ? <View className="mt-3">{action}</View> : null}
    </View>
  )
}

