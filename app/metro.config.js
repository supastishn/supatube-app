// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Let Metro use Watchman for file watching, as it is more efficient for
// large projects and can prevent "too many file watchers" errors.
// Make sure Watchman is installed on your system.

// Watch only files in the project root
config.watchFolders = [projectRoot];
// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Block files that metro should not watch
config.resolver.blockList = [
  new RegExp(`${projectRoot}/.expo/.*`),
];

module.exports = config;
