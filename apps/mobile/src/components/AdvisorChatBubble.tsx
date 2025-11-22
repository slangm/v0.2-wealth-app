import { View, Text } from "react-native"
import type { AdvisorMessage } from "../services/advisor"

type Props = {
  message: AdvisorMessage
}

export function AdvisorChatBubble({ message }: Props) {
  const isAssistant = message.role === "assistant"
  return (
    <View className={`flex self-${isAssistant ? "flex-start" : "flex-end"} max-w-[80%] mt-3`}>
      <View
        className="px-4 py-3 rounded-3xl"
        style={{
          backgroundColor: isAssistant ? "rgba(76, 123, 255, 0.15)" : "rgba(34, 197, 94, 0.2)",
          borderBottomLeftRadius: isAssistant ? 8 : 24,
          borderBottomRightRadius: isAssistant ? 24 : 8,
        }}
      >
        <Text className="text-white">{message.content}</Text>
        {isAssistant && message.actions && message.actions.length > 0 ? (
          <View className="mt-2 bg-white/5 rounded-2xl p-2">
            {message.actions.map((action, idx) => (
              <View key={`${message.id}-act-${idx}`} className="mb-1">
                <Text className="text-white text-xs">
                  • {action.summary}
                  {action.simulationOnly ? " (simulation)" : ""}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <Text className="text-[10px] text-white/50 mt-2">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </View>
  )
}
