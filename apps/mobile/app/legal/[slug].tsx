import { ScrollView, Text } from "react-native"
import { useLocalSearchParams } from "expo-router"
import { getLegalDoc, LegalDocSlug } from "@globalwealth/content"

export default function LegalScreen() {
  const params = useLocalSearchParams<{ slug: LegalDocSlug }>()
  const doc = getLegalDoc((params.slug ?? "terms") as LegalDocSlug)

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 20 }}>
      <Text className="text-white whitespace-pre-line">{doc}</Text>
    </ScrollView>
  )
}

