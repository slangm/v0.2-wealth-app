import { ScrollView, View, Text, Pressable } from "react-native"
import { Compass, Brain, Building2, Bitcoin, Rocket } from "lucide-react-native"
import { useRouter } from "expo-router"

const strategies = [
  { id: "us-market", label: "US Broad Market", subtitle: "S&P 500 • Total Market", badge: "Beginner", icon: Compass },
  { id: "ai-tech", label: "AI & Tech", subtitle: "Mag 7 • Pre-IPO AI", badge: "Growth", icon: Brain },
  { id: "real-estate", label: "Real Estate Income", subtitle: "REITs • Tokenized rent", badge: "Income", icon: Building2 },
  { id: "crypto-blue", label: "Crypto Blue Chips", subtitle: "BTC • ETH • Liquid staking", badge: "High Risk", icon: Bitcoin },
  { id: "venture", label: "Venture & Pre-IPO", subtitle: "OpenAI • X.AI • Syndicates", badge: "Advanced", icon: Rocket },
]

export default function ExploreScreen() {
  const router = useRouter()
  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 120 }}>
      <Text className="text-white text-3xl font-semibold">Explore</Text>
      <Text className="text-white/70 mt-2">Browse tokenized RWAs, ETFs, on-chain strategies.</Text>

      {strategies.map((strategy) => {
        const Icon = strategy.icon
        return (
          <Pressable
            key={strategy.id}
            className="bg-white/5 rounded-3xl p-5 mt-4"
            onPress={() => router.push("/(tabs)/invest")}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 rounded-full bg-white/10 items-center justify-center">
                  <Icon color="#a5b4fc" />
                </View>
                <View>
                  <Text className="text-white font-semibold text-lg">{strategy.label}</Text>
                  <Text className="text-white/70 text-sm">{strategy.subtitle}</Text>
                </View>
              </View>
              <View className="px-3 py-1 rounded-full bg-white/10">
                <Text className="text-white/70 text-xs uppercase">{strategy.badge}</Text>
              </View>
            </View>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

