const fs = require("fs")
const path = require("path")

// Expo Router references RNScreens via an add_dependency helper that causes iOS builds
// to fail when CocoaPods can't resolve it. This postinstall script rewrites the
// podspec to call s.dependency directly, ensuring pods install cleanly in CI/EAS.
const podspecPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-router",
  "ios",
  "ExpoHead.podspec",
)

if (!fs.existsSync(podspecPath)) {
  console.warn("[fix-expo-router] ExpoHead.podspec not found, skipping patch.")
  process.exit(0)
}

const original = fs.readFileSync(podspecPath, "utf8")
const problematicLine = '  add_dependency(s, "RNScreens")'
const replacementLine = '  s.dependency "RNScreens"'

if (!original.includes(problematicLine)) {
  console.log("[fix-expo-router] Podspec already patched.")
  process.exit(0)
}

const updated = original.replace(problematicLine, replacementLine)

if (updated === original) {
  console.error("[fix-expo-router] Failed to rewrite ExpoHead.podspec.")
  process.exit(1)
}

fs.writeFileSync(podspecPath, updated, "utf8")
console.log("[fix-expo-router] Patched ExpoHead.podspec to depend on RNScreens.")

