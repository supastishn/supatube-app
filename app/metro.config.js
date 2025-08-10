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
  // To fix "ENOSPC: System limit for number of file watchers reached",
  // we block node_modules directories from being watched. This will likely
  // cause "Unable to resolve module" errors, which will need to be addressed
  // separately.
  new RegExp(`${projectRoot}/node_modules/.*`),
  new RegExp(`${workspaceRoot}/node_modules/.*`),
];

module.exports = config;
