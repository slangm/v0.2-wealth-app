import "fast-text-encoding"
import "@ethersproject/shims"
import "react-native-get-random-values"

import { ReactNode, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Toast from "react-native-toast-message"
import { StatusBar } from "expo-status-bar"
import { PrivyProvider } from "@privy-io/expo"

type Props = {
  children: ReactNode
}

export function AppProviders({ children }: Props) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 1000 * 5,
          },
        },
      }),
  )

  const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID
  const privyClientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID

  if (!privyAppId) {
    throw new Error("Missing EXPO_PUBLIC_PRIVY_APP_ID. Add it to your .env before running the app.")
  }

  const privyProps = privyClientId ? { clientId: privyClientId } : {}

  return (
    <PrivyProvider appId={privyAppId} {...privyProps}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <StatusBar style="light" />
            <Toast position="top" />
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </PrivyProvider>
  )
}

