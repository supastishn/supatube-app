// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// This configuration is for a workspace-like setup where `npm install` is run at the root,
// and you run the app from the `app` directory.

// 1. Watch only files in the project root (`app` directory). This prevents watching
// the root node_modules and helps avoid the ENOSPC error.
config.watchFolders = [projectRoot];

// 2. Let Metro know where to resolve packages from. This is for dependencies hoisted
// to the root `node_modules` by npm workspaces.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. To further reduce watched files, we block the `backend` directory.
// The default `blockList` is a single RegExp, so we create an array to add rules.
const existingBlockList = config.resolver.blockList;
const newBlockList = [
  new RegExp(`${workspaceRoot}/backend/.*`),
];
if (existingBlockList) {
  newBlockList.push(existingBlockList);
}
config.resolver.blockList = newBlockList;


// 4. For workspaces, it's often recommended to disable symlink resolution.
config.resolver.resolveSymlinks = false;

module.exports = config;
