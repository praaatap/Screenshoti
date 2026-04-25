import React from 'react';
import {Platform, Pressable, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, DefaultTheme, DarkTheme, type Theme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {designTokens} from '../theme/tokens';
import {DetailScreen} from '../screens/DetailScreen';
import {HomeScreen} from '../features/home/screens';
import {AlbumsScreen, AlbumDetailScreen} from '../features/albums/screens';
import {FavoritesScreen} from '../features/favorites/screens';
import {SearchScreen} from '../features/search/screens';
import {SettingsScreen} from '../features/settings/screens';
import {useThemeStore} from '../store/useThemeStore';
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
  headerTitleStyle: designTokens.typography.titleLarge,
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
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
          ...designTokens.elevation.medium,
          ...(Platform.OS === 'ios' ? {shadowOffset: {width: 0, height: -3}} : {}),
        },
        tabBarLabelStyle: {
          ...designTokens.typography.labelSmall,
          marginTop: 2,
        },
        tabBarIcon: ({color, focused}) => {
          const iconMap: Record<keyof BottomTabParamList, string> = {
            HomeTab: 'image-multiple',
            AlbumsTab: 'folder-multiple-image',
            FavoritesTab: 'heart',
            SettingsTab: 'cog',
          };

          return (
            <View style={{alignItems: 'center'}}>
              <MaterialCommunityIcons name={iconMap[route.name]} size={designTokens.iconSize.md} color={color} />
              {focused && (
                <View style={{
                  width: 24,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: theme.colors.primary,
                  marginTop: 3,
                }} />
              )}
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
          tabBarBadgeStyle: {backgroundColor: theme.colors.primary, fontSize: 10},
        }}
      />
      <BottomTabs.Screen name="SettingsTab" component={SettingsStackNavigator} options={{title: 'Settings', tabBarAccessibilityLabel: 'Settings tab, app preferences'}} />
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
      <RootStack.Navigator
        screenOptions={{
          ...sharedHeaderOptions(appTheme),
        }}>
        <RootStack.Screen name="Main" component={MainTabsNavigator} options={{headerShown: false}} />
        <RootStack.Screen
          name="Detail"
          component={DetailScreen}
          options={() => ({
            title: 'Details',
            animation: 'fade_from_bottom',
            animationDuration: 250,
            headerRight: () => (
              <Pressable
                onPress={() => {}}
                style={{padding: designTokens.spacing.xs}}
                accessibilityLabel="Share screenshot">
                <MaterialCommunityIcons name="share-variant-outline" size={designTokens.iconSize.md} color={appTheme.colors.text} />
              </Pressable>
            ),
          })}
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
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
