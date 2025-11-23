import { ExpoConfig, ConfigContext } from "expo/config"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Global Wealth",
  slug: "global-wealth-app",
  version: "0.2.0",
  scheme: "globalwealth",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  updates: {
    fallbackToCacheTimeout: 0,
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.globalwealth.mobile",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.globalwealth.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://api.preview.globalwealth.finance",
    coinbase: {
      apiKeyName: process.env.EXPO_PUBLIC_CDP_API_KEY_NAME,
      network: process.env.EXPO_PUBLIC_AGENT_NETWORK ?? "base-mainnet",
    },
    privy: {
      appId: process.env.EXPO_PUBLIC_PRIVY_APP_ID,
      clientId: process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID,
    },
    eas: {
      projectId: "6e7b9d4e-609a-4966-813a-42e2c9eb4e43",
    },
  },
  plugins: ["expo-router"],
})

