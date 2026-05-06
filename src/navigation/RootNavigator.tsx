import React, {useCallback, useEffect, useRef} from 'react';
import {AppState, Platform, StyleSheet, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, DefaultTheme, DarkTheme, type Theme, useNavigationContainerRef} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {designTokens} from '../theme/tokens';
import {linking} from './linking';
import {DetailScreen} from '../screens/DetailScreen';
import {PinScreen} from '../screens/PinScreen';
import {HomeScreen} from '../features/home/screens';
import {AlbumsScreen, AlbumDetailScreen} from '../features/albums/screens';
import {FavoritesScreen} from '../features/favorites/screens';
import {SearchScreen} from '../features/search/screens';
import {SettingsScreen} from '../features/settings/screens';
import {useThemeStore} from '../store/useThemeStore';
import {usePrivacyStore} from '../store/usePrivacyStore';
import type {
  AlbumsStackParamList,
  BottomTabParamList,
  FavoritesStackParamList,
  HomeStackParamList,
  RootStackParamList,
  SettingsStackParamList,
} from '../types';
import {useScreenshotStore} from '../store/useScreenshotStore';

interface EmptyProps {}

const RootStack = createNativeStackNavigator<RootStackParamList>();
const BottomTabs = createBottomTabNavigator<BottomTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AlbumsStack = createNativeStackNavigator<AlbumsStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const sharedHeaderOptions = (theme: ReturnType<typeof useThemeStore.getState>['theme']) => ({
  headerStyle: {backgroundColor: theme.colors.background},
  headerShadowVisible: false,
  headerTintColor: theme.colors.text,
  headerTitleStyle: {...designTokens.typography.titleLarge, color: theme.colors.text},
  headerBackTitleVisible: false,
} as const);

const HomeStackNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <HomeStack.Navigator screenOptions={sharedHeaderOptions(theme)}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{headerShown: false}} />
    </HomeStack.Navigator>
  );
};

const AlbumsStackNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <AlbumsStack.Navigator screenOptions={sharedHeaderOptions(theme)}>
      <AlbumsStack.Screen name="Albums" component={AlbumsScreen} />
    </AlbumsStack.Navigator>
  );
};

const FavoritesStackNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <FavoritesStack.Navigator screenOptions={sharedHeaderOptions(theme)}>
      <FavoritesStack.Screen name="Favorites" component={FavoritesScreen} />
    </FavoritesStack.Navigator>
  );
};

const SettingsStackNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <SettingsStack.Navigator screenOptions={sharedHeaderOptions(theme)}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    </SettingsStack.Navigator>
  );
};

const MainTabsNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  const favoriteCount = useScreenshotStore(
    (state) => state.screenshots.filter((s) => s.isFavorite).length,
  );

  return (
    <BottomTabs.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.text,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          ...designTokens.typography.caption,
          marginTop: 2,
        },
        tabBarIcon: ({color, focused}) => {
          const iconMap: Record<keyof BottomTabParamList, string> = {
            HomeTab: focused ? 'image-multiple' : 'image-multiple-outline',
            AlbumsTab: focused ? 'folder-multiple' : 'folder-multiple-outline',
            FavoritesTab: focused ? 'heart' : 'heart-outline',
            SettingsTab: focused ? 'cog' : 'cog-outline',
          };

          return (
            <View style={styles.tabIconWrapper}>
              <MaterialCommunityIcons
                name={iconMap[route.name]}
                size={designTokens.iconSize.sm}
                color={color}
              />
            </View>
          );
        },
      })}>
      <BottomTabs.Screen name="HomeTab" component={HomeStackNavigator} options={{title: 'Home', tabBarAccessibilityLabel: 'Home tab, view all screenshots'}} />
      <BottomTabs.Screen name="AlbumsTab" component={AlbumsStackNavigator} options={{title: 'Albums', tabBarAccessibilityLabel: 'Albums tab, organize screenshots'}} />
      <BottomTabs.Screen
        name="FavoritesTab"
        component={FavoritesStackNavigator}
        options={{
          title: 'Favorites',
          tabBarAccessibilityLabel: `Favorites tab${favoriteCount > 0 ? `, ${favoriteCount} items` : ''}`,
          tabBarBadge: favoriteCount > 0 ? favoriteCount : undefined,
          tabBarBadgeStyle: {backgroundColor: theme.colors.text, fontSize: 10},
        }}
      />
      <BottomTabs.Screen name="SettingsTab" component={SettingsStackNavigator} options={{title: 'Settings', tabBarAccessibilityLabel: 'Settings tab, app preferences'}} />
    </BottomTabs.Navigator>
  );
};

export const RootNavigator: React.FC<EmptyProps> = () => {
  const appTheme = useThemeStore((state) => state.theme);
  const pinEnabled = usePrivacyStore((state) => state.pinEnabled);
  const lockOnBackground = usePrivacyStore((state) => state.lockOnBackground);
  const navRef = useNavigationContainerRef<RootStackParamList>();
  const appState = useRef(AppState.currentState);

  const navigationTheme: Theme = {
    ...(appTheme.isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(appTheme.isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.text,
      border: appTheme.colors.border,
      primary: appTheme.colors.primary,
      notification: appTheme.colors.primary,
    },
  };

  const handlePinUnlock = useCallback(() => {
    if (navRef.isReady()) {
      navRef.goBack();
    }
  }, [navRef]);

  useEffect(() => {
    if (!pinEnabled || !lockOnBackground) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current !== 'background' &&
        appState.current !== 'inactive' &&
        (nextState === 'background' || nextState === 'inactive')
      ) {
        appState.current = nextState;
        return;
      }
      if (
        (appState.current === 'background' || appState.current === 'inactive') &&
        nextState === 'active'
      ) {
        appState.current = nextState;
        if (navRef.isReady()) {
          navRef.navigate('PinLock');
        }
      } else {
        appState.current = nextState;
      }
    });

    return () => sub.remove();
  }, [pinEnabled, lockOnBackground, navRef]);

  return (
    <NavigationContainer ref={navRef} theme={navigationTheme} linking={linking}>
      <RootStack.Navigator
        screenOptions={{
          ...sharedHeaderOptions(appTheme),
        }}>
        <RootStack.Screen name="Main" component={MainTabsNavigator} options={{headerShown: false}} />
        <RootStack.Screen
          name="Detail"
          component={DetailScreen}
          options={{
            title: 'Details',
            animation: 'fade_from_bottom',
            animationDuration: 250,
          }}
        />
        <RootStack.Screen
          name="AlbumDetail"
          component={AlbumDetailScreen}
          options={({route}) => ({title: route.params.albumName})}
        />
        <RootStack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: false,
            animation: 'slide_from_bottom',
            animationDuration: 300,
          }}
        />
        <RootStack.Screen
          name="PinLock"
          options={{
            headerShown: false,
            animation: 'fade',
            animationDuration: 200,
            gestureEnabled: false,
          }}>
          {() => <PinScreen onUnlock={handlePinUnlock} />}
        </RootStack.Screen>
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabIconWrapper: {alignItems: 'center'},
  tabActiveIndicator: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    marginTop: 3,
  },
});
