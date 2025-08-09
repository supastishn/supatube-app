// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Get default config for this app directory
const config = getDefaultConfig(__dirname);

// Optimize watch performance by watching only our app directory
config.watchFolders = [path.resolve(__dirname)];

module.exports = config;
