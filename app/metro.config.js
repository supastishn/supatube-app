// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Disable Watchman
config.watchman = false;

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];
// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Block files that metro should not watch
config.resolver.blockList = [
  new RegExp(`${workspaceRoot}/backend/.*`),
  new RegExp(`${workspaceRoot}/.git/.*`),
  // The following regex is restrictive. It attempts to block all node_modules
  // except for 'expo-router'. This can cause "Unable to resolve module" errors
  // for other packages that your app or expo-router depends on.
  // The standard monorepo setup is to not block node_modules directories but
  // instead point to them in `watchFolders` and `nodeModulesPaths`.
  new RegExp(`${workspaceRoot}/node_modules/(?!expo-router/).*`),
  new RegExp(`${projectRoot}/node_modules/(?!expo-router/).*`),
];

module.exports = config;
