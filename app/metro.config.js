// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

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
  // Prevent Metro from watching files in node_modules. This will improve performance
  // and prevent "too many files watched" errors.
  new RegExp(`${workspaceRoot}/node_modules/.*`),
  new RegExp(`${projectRoot}/node_modules/.*`),
];

module.exports = config;
