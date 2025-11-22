import { View } from "react-native"

type Props = {
  progress: number
  color?: string
}

export function ProgressBar({ progress, color = "#4C7BFF" }: Props) {
  return (
    <View className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
      <View className="h-3 rounded-full" style={{ width: `${progress}%`, backgroundColor: color }} />
    </View>
  )
}

