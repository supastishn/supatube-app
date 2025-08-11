// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);


// Watch only files in the project root
config.watchFolders = [projectRoot];
// Let Metro know where to resolve packages and in what order
/*config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];*/

// To prevent ENOSPC (System limit for file watchers) errors, we block Metro from watching node_modules.
config.resolver.blockList = [
  new RegExp(`${projectRoot}/\.expo/.*`),
  new RegExp(`${projectRoot}/node_modules/.*`),
];

module.exports = config;
