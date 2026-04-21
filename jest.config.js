module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context)/)',
  ],
};
