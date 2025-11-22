const { getDefaultConfig } = require("expo/metro-config")
const path = require("path")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "../..")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [workspaceRoot]
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, "node_modules"),
  path.join(workspaceRoot, "node_modules"),
]
config.resolver.unstable_enablePackageExports = true
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@globalwealth/ui": path.join(workspaceRoot, "packages/ui/src"),
}

module.exports = config

