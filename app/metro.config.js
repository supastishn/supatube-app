// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get default config for this app directory
const config = getDefaultConfig(__dirname);

// Normalize blockList: handle both arrays and single values
const currentBlockList = config.resolver.blockList || [];
const normalizedBlockList = Array.isArray(currentBlockList) 
  ? currentBlockList 
  : [currentBlockList].filter(Boolean);

// Optimize watch performance by:
// 1. Only watching our app directory
// 2. Ignoring node_modules recursively
config.watchFolders = [path.resolve(__dirname)];
config.resolver = {
  ...config.resolver,
  blockList: [
    ...normalizedBlockList,
    /.*\/node_modules\/.*/,
  ]
};

module.exports = config;
