// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// --- Monorepo setup ---
// This configuration is tailored for a monorepo setup.

// 1. Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages.
// This is crucial for hoisted dependencies in the root node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Force Metro to resolve symlinks to their real path.
config.resolver.resolveSymlinks = false;

// We do NOT block node_modules, as that causes the resolution error.
// Instead, we block other parts of the monorepo that are not part of the app
// bundle to reduce the number of files watched.
config.resolver.blockList = [
  // Default block list includes .expo, let's keep it and add our own.
  ...config.resolver.blockList,
  // We don't need to watch the backend folder for the frontend app.
  new RegExp(`${workspaceRoot}/backend/.*`),
];

module.exports = config;
