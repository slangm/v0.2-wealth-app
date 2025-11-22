module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "nativewind/babel",
      require.resolve("expo-router/babel"),
      [
        "module-resolver",
        {
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
          alias: {
            "@globalwealth/ui": "../../packages/ui/src",
          },
        },
      ],
      "react-native-reanimated/plugin",
    ],
  }
}

