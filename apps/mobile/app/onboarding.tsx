import { useState, useEffect } from "react"
import { View, Text, Pressable, ScrollView } from "react-native"
import { useRouter } from "expo-router"
import { Shield, Wallet, Clock3, LogIn } from "lucide-react-native"
import Toast from "react-native-toast-message"
import { useLoginWithOAuth } from "@privy-io/expo"

import { usePortfolioStore } from "../src/store/portfolio"
import { useSession } from "../src/hooks/useSession"

const contributionOptions = [
  { id: "starter", label: "Starter", amount: 200, copy: "Build $1k safety net in 5 months" },
  { id: "secure", label: "Secure", amount: 400, copy: "Reach 6 months runway in 9 months" },
  { id: "aggressive", label: "Freedom", amount: 700, copy: "Split deposits 60/40 security→growth" },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const session = useSession()
  const { setLocale } = usePortfolioStore()
  const [step, setStep] = useState(0)
  const [selectedOption, setSelectedOption] = useState(contributionOptions[1])
  const [loading, setLoading] = useState(false)
  const { login } = useLoginWithOAuth()

  useEffect(() => {
    if (session.status === "authenticated") {
      router.replace("/(tabs)")
    }
  }, [session.status, router])

  async function handleContinue() {
    if (step === 0) {
      try {
        setLoading(true)
        await login({ provider: "google" })
        setStep(1)
      } catch (error) {
        console.warn("Google login failed", error)
        Toast.show({ type: "error", text1: "Google signin failed", text2: "Try again or check Privy config." })
      } finally {
        setLoading(false)
      }
      return
    }
    if (step === 1) {
      setStep(2)
      setLocale("es-AR")
      return
    }
    router.replace("/(tabs)")
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 24, paddingBottom: 80 }}>
      <Text className="text-white text-4xl font-extrabold">Global Wealth</Text>
      <Text className="text-white/70 mt-2">Reach “safe & growing” savings in under 10 minutes.</Text>

      {step === 0 && (
        <View className="mt-8 bg-white/5 rounded-3xl p-5 space-y-4">
          <Text className="text-white text-lg font-semibold">Sign in with Google</Text>
          <Text className="text-white/70 text-sm">
            Privy uses your Google account to create an embedded wallet—no seed phrases, just one tap to unlock
            deposits.
          </Text>
          <View className="flex-row items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
            <LogIn color="#fde047" />
            <Text className="text-white/80 text-sm">Secure OAuth + Privy-managed wallets.</Text>
          </View>
          <Text className="text-white/60 text-xs">
            You can always disconnect Google from Settings → Accounts. We never see your password.
          </Text>
        </View>
      )}

      {step === 1 && (
        <View className="mt-8">
          <Text className="text-white text-xl font-semibold mb-3">How much can you auto-save?</Text>
          {contributionOptions.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setSelectedOption(option)}
              className={`rounded-3xl p-4 mb-3 border ${selectedOption.id === option.id ? "border-primary bg-primary/10" : "border-white/10"}`}
            >
              <Text className="text-white text-lg font-semibold">{option.label}</Text>
              <Text className="text-emerald-400 text-2xl font-bold mt-1">${option.amount}/month</Text>
              <Text className="text-white/70 mt-1">{option.copy}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {step === 2 && (
        <View className="mt-8 bg-white/5 rounded-3xl p-5 space-y-4">
          <View className="flex-row items-center gap-3">
            <Shield color="#60a5fa" />
            <View>
              <Text className="text-white font-semibold">Security phase</Text>
              <Text className="text-white/70 text-sm">Fund 6 months of expenses in Protected Savings</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <Wallet color="#fbbf24" />
            <View>
              <Text className="text-white font-semibold">Growth phase</Text>
              <Text className="text-white/70 text-sm">Auto-route extra deposits into global ETFs + crypto</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <Clock3 color="#22c55e" />
            <View>
              <Text className="text-white font-semibold">Freedom phase</Text>
              <Text className="text-white/70 text-sm">Track 25-year runway and plan withdrawals</Text>
            </View>
          </View>
        </View>
      )}

      <Pressable
        onPress={handleContinue}
        disabled={loading}
        className="mt-8 bg-primary rounded-full py-4 items-center"
      >
        <Text className="text-white font-semibold text-lg">
          {step === 0 ? (loading ? "Connecting..." : "Continue with Google") : "Continue"}
        </Text>
      </Pressable>
    </ScrollView>
  )
}

