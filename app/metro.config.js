// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get default config for this app directory
const config = getDefaultConfig(__dirname);

// Optimize watch performance by:
// 1. Only watching our app directory
// 2. Ignoring node_modules recursively
config.watchFolders = [path.resolve(__dirname)];
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(config.resolver.blockList || []),
    /.*\/node_modules\/.*/,
  ]
};

module.exports = config;
