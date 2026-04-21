import React from 'react';
import {StatusBar, StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useThemeStore} from './src/store/useThemeStore';

interface AppProps {}

const App: React.FC<AppProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
          <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
          <RootNavigator />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export default App;
