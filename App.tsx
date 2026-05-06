import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Platform, StatusBar, StyleSheet, Text, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useThemeStore} from './src/store/useThemeStore';
import {useScreenshotStore} from './src/store/useScreenshotStore';
import {useToastStore} from './src/store/useToastStore';
import {Toast} from './src/components/ui/Toast';
import {seedDemoDataIfNeeded} from './src/services/demo/demoSeed';

const WORDMARK_STYLE = {fontSize: 18, fontWeight: '800' as const, letterSpacing: -0.5};

const App: React.FC = () => {
  const theme = useThemeStore((state) => state.theme);
  const addSharedScreenshots = useScreenshotStore((state) => state.loadScreenshots);
  const showToast = useToastStore((state) => state.show);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemoDataIfNeeded()
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  // On Android: re-check gallery when app comes to foreground after receiving a share
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // The share intent is handled via deep link or manual refresh — trigger load
    const timer = setTimeout(() => {
      void addSharedScreenshots().catch(() => undefined);
    }, 800);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <View style={[styles.splash, {backgroundColor: theme.colors.background}]}>
        <Text style={[WORDMARK_STYLE, {color: theme.colors.text}]}>screenshoti</Text>
        <ActivityIndicator color={theme.colors.muted} style={styles.loader} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
          <StatusBar
            barStyle={theme.isDark ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.background}
            translucent={false}
          />
          <RootNavigator />
          <Toast />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {flex: 1},
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loader: {marginTop: 8},
});

export default App;
