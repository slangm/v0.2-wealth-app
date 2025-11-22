import { Stack } from "expo-router"

import { AppProviders } from "../src/providers/app-providers"

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="(modals)/add-money" options={{ presentation: "modal", title: "Add Money" }} />
        <Stack.Screen name="(modals)/rate-boost" options={{ presentation: "modal", title: "Boost APY" }} />
        <Stack.Screen name="(modals)/simulate" options={{ presentation: "modal", title: "Savings Simulator" }} />
        <Stack.Screen name="legal/[slug]" options={{ presentation: "modal", title: "Legal" }} />
      </Stack>
    </AppProviders>
  )
}

