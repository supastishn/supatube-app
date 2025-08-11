// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Find the project and workspace directories
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot, {
  // Support for ignoring files and directories from watching in a monorepo.
  // This uses the root .gitignore file.
  unstable_enableGloballyIgnoredDirectories: true,
});

// This configuration is for a workspace-like setup where `npm install` is run at the root,
// and you run the app from the `app` directory.

// 1. Watch all files in the workspace. Metro's default behavior is to NOT watch files
// outside of the project root. With a monorepo, we want to watch the entire workspace.
// However, watching the root node_modules directory can exceed file watcher limits (ENOSPC error).
// A better approach for this setup is to let Metro watch only the project root (`app`) by default
// and explicitly tell it where to find hoisted dependencies via `nodeModulesPaths`.
// By commenting out `watchFolders`, it defaults to the project root.
// config.watchFolders = [workspaceRoot];

// 2. Let Metro know where to resolve packages from. This is for dependencies hoisted
// to the root `node_modules` by npm workspaces.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. To further reduce watched files, we block directories that don't need to be watched.
// The default `blockList` is a single RegExp, so we create an array to add rules.
// `node_modules` is now ignored by the watcher via `unstable_enableGloballyIgnoredDirectories`.
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
