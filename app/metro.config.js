// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get default config for this app directory
const config = getDefaultConfig(__dirname);

const projectRoot = path.resolve(__dirname, '..');

// To prevent ENOSPC errors (too many files watched), we can tell Metro
// to not watch certain directories within node_modules.
config.resolver.blockList = [
  /node_modules\/.*\/__tests__\/.*/,
  /node_modules\/.*\/android\/.*/,
  /node_modules\/.*\/ios\/.*/,
  /node_modules\/.*\/build\/.*/,
  /node_modules\/.*\/\\.git\/.*/,
  /node_modules\/.*\/\\.github\/.*/,
  /node_modules\/.*\/\\.vscode\/.*/,
  new RegExp(`${projectRoot}/node_modules/.*`),
  new RegExp(`${projectRoot}/backend/.*`),
];

module.exports = config;
