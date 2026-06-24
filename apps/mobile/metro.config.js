const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  "@producerhit/shared": path.resolve(monorepoRoot, "packages/shared"),
};

// Stale npm temp dirs (e.g. .expo-blur-*) crash Metro watcher on Windows.
const blockList = config.resolver.blockList ?? [];
config.resolver.blockList = [
  ...blockList,
  /node_modules[\\/]\.expo-blur-.*/,
];

module.exports = config;
