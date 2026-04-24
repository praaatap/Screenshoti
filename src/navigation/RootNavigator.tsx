import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { DetailScreen } from '../screens/DetailScreen';
import { HomeScreen } from '../features/home/screens';
import { AlbumsScreen, AlbumDetailScreen } from '../features/albums/screens';
import { FavoritesScreen } from '../features/favorites/screens';
import { SearchScreen } from '../features/search/screens';
import { SettingsScreen } from '../features/settings/screens';
import { useThemeStore } from '../store/useThemeStore';
import type {
  AlbumsStackParamList,
  BottomTabParamList,
  FavoritesStackParamList,
  HomeStackParamList,
  RootStackParamList,
  SettingsStackParamList,
} from '../types';
import { useScreenshotStore } from '../store/useScreenshotStore';

interface EmptyProps { }

const RootStack = createNativeStackNavigator<RootStackParamList>();
const BottomTabs = createBottomTabNavigator<BottomTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AlbumsStack = createNativeStackNavigator<AlbumsStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const HomeStackNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.background},
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
      }}>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ title: 'Screenshots' }} />
    </HomeStack.Navigator>
  );
};

const AlbumsStackNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <AlbumsStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.background},
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
      }}>
      <AlbumsStack.Screen name="Albums" component={AlbumsScreen} />
    </AlbumsStack.Navigator>
  );
};

const FavoritesStackNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <FavoritesStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.background},
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
      }}>
      <FavoritesStack.Screen name="Favorites" component={FavoritesScreen} />
    </FavoritesStack.Navigator>
  );
};

const SettingsStackNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: {backgroundColor: theme.colors.background},
        headerShadowVisible: false,
        headerTintColor: theme.colors.text,
      }}>
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
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 8,
          paddingTop: 7,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color, size }) => {
          const iconMap: Record<keyof BottomTabParamList, string> = {
            HomeTab: 'image-multiple',
            AlbumsTab: 'folder-multiple-image',
            FavoritesTab: 'heart',
            SettingsTab: 'cog',
          };

          return <MaterialCommunityIcons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}>
      <BottomTabs.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: 'Home' }} />
      <BottomTabs.Screen name="AlbumsTab" component={AlbumsStackNavigator} options={{ title: 'Albums' }} />
      <BottomTabs.Screen
        name="FavoritesTab"
        component={FavoritesStackNavigator}
        options={{
          title: 'Favorites',
          tabBarBadge: favoriteCount > 0 ? favoriteCount : undefined,
          tabBarBadgeStyle: { backgroundColor: theme.colors.primary, fontSize: 10 },
        }}
      />

      <BottomTabs.Screen name="SettingsTab" component={SettingsStackNavigator} options={{ title: 'Settings' }} />
    </BottomTabs.Navigator>
  );
};

export const RootNavigator: React.FC<EmptyProps> = () => {
  const appTheme = useThemeStore((state) => state.theme);

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

  return (
    <NavigationContainer theme={navigationTheme}>
      <RootStack.Navigator>
        <RootStack.Screen name="Main" component={MainTabsNavigator} options={{ headerShown: false }} />
        <RootStack.Screen name="Detail" component={DetailScreen} options={{ title: 'Screenshot details' }} />
        <RootStack.Screen
          name="AlbumDetail"
          component={AlbumDetailScreen}
          options={({ route }) => ({ title: route.params.albumName })}
        />
        <RootStack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
