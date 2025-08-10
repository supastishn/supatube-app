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
];

module.exports = config;
