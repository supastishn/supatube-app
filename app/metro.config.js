// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get default config for this app directory
const config = getDefaultConfig(__dirname);

const projectRoot = path.resolve(__dirname, '..');

// To prevent ENOSPC errors (too many files watched), we can tell Metro
// to not watch certain directories.
config.resolver.blockList = [
  // Ignore the root node_modules directory.
  new RegExp(`${projectRoot}/node_modules/.*`),
  // Ignore the backend directory.
  new RegExp(`${projectRoot}/backend/.*`),
];

module.exports = config;
