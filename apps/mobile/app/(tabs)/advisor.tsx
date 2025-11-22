import { useEffect, useState } from "react"
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from "react-native"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Send } from "lucide-react-native"

import { AdvisorChatBubble } from "../../src/components/AdvisorChatBubble"
import { fetchAdvisorHistory, sendAdvisorPrompt } from "../../src/services/advisor"
import type { AdvisorMessage } from "../../src/services/advisor"
import { usePortfolioStore } from "../../src/store/portfolio"
import { usePrivySession } from "../../src/hooks/usePrivySession"

export default function AdvisorScreen() {
  const { securityBalance, growthBalance, monthlyExpenses } = usePortfolioStore()
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<AdvisorMessage[]>([])
  const session = usePrivySession()
  const token = session.status === "authenticated" ? session.user.accessToken : undefined

  const { data: history } = useQuery<AdvisorMessage[]>({
    queryKey: ["advisor-history"],
    queryFn: () => fetchAdvisorHistory(token),
  })

  useEffect(() => {
    if (history) {
      setMessages(history)
    }
  }, [history])

  const mutation = useMutation({
    mutationFn: (vars: Parameters<typeof sendAdvisorPrompt>[0]) => sendAdvisorPrompt(vars, token),
    onSuccess: (assistantMessage) => {
      setMessages((prev) => [...prev, assistantMessage])
      setPrompt("")
    },
  })

  const totalNetWorth = securityBalance + growthBalance

  function handleSend() {
    if (!prompt.trim()) return
    const userMessage: AdvisorMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt.trim(),
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMessage])
    mutation.mutate({
      prompt: prompt.trim(),
      totalNetWorth,
      monthlyExpenses,
    })
  }

  return (
    <KeyboardAvoidingView className="flex-1 bg-background" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View className="flex-1">
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }}>
          <Text className="text-white text-3xl font-semibold">AI Advisor</Text>
          <Text className="text-white/70 mt-2">
            Ask anything about your safety ladder, deposits, or macro surprises. Responses stay personalized to your plan.
          </Text>

          {messages.map((message) => (
            <AdvisorChatBubble message={message} key={message.id} />
          ))}
        </ScrollView>
      </View>
      <View className="absolute bottom-0 left-0 right-0 bg-background/95 border-t border-white/10 p-4">
        <View className="flex-row items-center bg-white/10 rounded-full px-3">
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask about rates, runway, or allocations..."
            placeholderTextColor="#94a3b8"
            multiline
            style={{ flex: 1, color: "white", padding: 12 }}
          />
          <Pressable
            onPress={handleSend}
            disabled={mutation.isPending}
            className="h-12 w-12 rounded-full bg-primary items-center justify-center ml-2"
          >
            <Send color="white" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
