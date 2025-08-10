// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// The backend is in a sibling directory. We don't want Metro to watch it.
config.resolver.blockList = [
  new RegExp(`${workspaceRoot}/backend/.*`),
  new RegExp(`${workspaceRoot}/.git/.*`),
  // It's a good practice to explicitly ignore node_modules folder.
  // This will prevent "too many files watched" errors.
  new RegExp(`${projectRoot}/node_modules/.*`),
  new RegExp(`${workspaceRoot}/node_modules/.*`),
];

module.exports = config;
