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
  },
  android: {
    package: "com.globalwealth.mobile",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
  },
  extra: {
    eas: {
      projectId: "global-wealth-app",
    },
  },
  plugins: ["expo-router"],
})

