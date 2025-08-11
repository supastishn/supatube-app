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

// Block specific directories from being watched
config.resolver.blockList = [
  // .expo cache
  new RegExp(`${projectRoot}/\.expo/.*`),
  // specific problematic modules
  new RegExp(`${projectRoot}/node_modules/expo-document-picker/ios/.*`),
  // large JavaScript directories that shouldn't be watched
  new RegExp(`${projectRoot}/node_modules\/.*\/node_modules\/.*`),
  new RegExp(`${projectRoot}/node_modules\/.*\/scaffolded\-.*`),
  new RegExp(`${projectRoot}/node_modules\/.*\/docgoogle\/.*`),
  new RegExp(`${projectRoot}/node_modules\/.*\/third\-party\/.*`),
  new RegExp(`${projectRoot}/node_modules\/.*\/dist\-types\/.*`),
];

module.exports = config;
