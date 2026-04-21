import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer, DefaultTheme, DarkTheme, type Theme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {AlbumsScreen} from '../screens/AlbumsScreen';
import {AlbumDetailScreen} from '../screens/AlbumDetailScreen';
import {DetailScreen} from '../screens/DetailScreen';
import {FavoritesScreen} from '../screens/FavoritesScreen';
import {HomeScreen} from '../screens/HomeScreen';
import {SearchScreen} from '../screens/SearchScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {useThemeStore} from '../store/useThemeStore';
import type {
  AlbumsStackParamList,
  BottomTabParamList,
  FavoritesStackParamList,
  HomeStackParamList,
  RootStackParamList,
  SettingsStackParamList,
} from '../types';

interface EmptyProps {}

const RootStack = createNativeStackNavigator<RootStackParamList>();
const BottomTabs = createBottomTabNavigator<BottomTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const AlbumsStack = createNativeStackNavigator<AlbumsStackParamList>();
const FavoritesStack = createNativeStackNavigator<FavoritesStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const HomeStackNavigator: React.FC<EmptyProps> = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} options={{title: 'Screenshots'}} />
    </HomeStack.Navigator>
  );
};

const AlbumsStackNavigator: React.FC<EmptyProps> = () => {
  return (
    <AlbumsStack.Navigator>
      <AlbumsStack.Screen name="Albums" component={AlbumsScreen} />
    </AlbumsStack.Navigator>
  );
};

const FavoritesStackNavigator: React.FC<EmptyProps> = () => {
  return (
    <FavoritesStack.Navigator>
      <FavoritesStack.Screen name="Favorites" component={FavoritesScreen} />
    </FavoritesStack.Navigator>
  );
};

const SettingsStackNavigator: React.FC<EmptyProps> = () => {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    </SettingsStack.Navigator>
  );
};

const MainTabsNavigator: React.FC<EmptyProps> = () => {
  const theme = useThemeStore((state) => state.theme);

  return (
    <BottomTabs.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({color, size}) => {
          const iconMap: Record<keyof BottomTabParamList, string> = {
            HomeTab: 'image-multiple',
            AlbumsTab: 'folder-multiple-image',
            FavoritesTab: 'heart',
            SettingsTab: 'cog',
          };

          return <MaterialCommunityIcons name={iconMap[route.name]} size={size} color={color} />;
        },
      })}>
      <BottomTabs.Screen name="HomeTab" component={HomeStackNavigator} options={{title: 'Home'}} />
      <BottomTabs.Screen name="AlbumsTab" component={AlbumsStackNavigator} options={{title: 'Albums'}} />
      <BottomTabs.Screen
        name="FavoritesTab"
        component={FavoritesStackNavigator}
        options={{title: 'Favorites'}}
      />
      <BottomTabs.Screen name="SettingsTab" component={SettingsStackNavigator} options={{title: 'Settings'}} />
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
        <RootStack.Screen name="Main" component={MainTabsNavigator} options={{headerShown: false}} />
        <RootStack.Screen name="Detail" component={DetailScreen} options={{title: 'Screenshot details'}} />
        <RootStack.Screen
          name="AlbumDetail"
          component={AlbumDetailScreen}
          options={({route}) => ({title: route.params.albumName})}
        />
        <RootStack.Screen name="Search" component={SearchScreen} options={{headerShown: false}} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
