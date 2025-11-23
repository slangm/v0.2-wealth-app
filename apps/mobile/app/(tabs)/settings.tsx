import { ScrollView, View, Text, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { useSession } from "../../src/hooks/useSession"

const legalLinks = [
  { slug: "terms", label: "Terms of Service" },
  { slug: "privacy", label: "Privacy Notice" },
  { slug: "risk-disclosure", label: "Risk Disclosure" },
]

export default function SettingsScreen() {
  const router = useRouter()
  const session = useSession()

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
      <Text className="text-white text-3xl font-semibold">Settings</Text>
      {session.status === "authenticated" ? (
        <View className="bg-white/5 rounded-3xl p-4 mt-4">
          <Text className="text-white text-lg font-semibold">{session.user.email}</Text>
          <Text className="text-white/60 text-xs mt-1">{session.user.walletAddress}</Text>
          <Text className="text-white/60 text-xs mt-1">Region: {session.user.region}</Text>
        </View>
      ) : null}

      <View className="mt-6">
        <Text className="text-white/70 text-xs uppercase tracking-wide">Legal & Disclosures</Text>
        {legalLinks.map((link) => (
          <Pressable
            key={link.slug}
            onPress={() => router.push(`/legal/${link.slug}`)}
            className="flex-row justify-between items-center border-b border-white/10 py-4"
          >
            <Text className="text-white text-base">{link.label}</Text>
            <Text className="text-white/40">›</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={async () => {
          await session.logout()
          router.replace("/onboarding")
        }}
        className="mt-8 border border-white/20 rounded-full py-3 items-center"
      >
        <Text className="text-red-400 font-semibold">Sign out</Text>
      </Pressable>
    </ScrollView>
  )
}

