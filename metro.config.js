const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation loads a .wasm binary; Metro needs to treat
// it as a static asset rather than trying to resolve it as a JS module.
config.resolver.assetExts.push('wasm');

module.exports = config;
