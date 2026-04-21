import {create} from 'zustand';
import type {AppTheme, ThemeState} from '../types';
import {useFilterStore} from './useFilterStore';
import {useScreenshotStore} from './useScreenshotStore';

const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: '#f4f5f7',
    surface: '#ffffff',
    text: '#1f2933',
    primary: '#0b7a75',
    border: '#d8dee9',
    muted: '#627182',
    danger: '#c92a2a',
    success: '#2b8a3e',
  },
};

const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: '#111827',
    surface: '#1f2937',
    text: '#f3f4f6',
    primary: '#34d399',
    border: '#374151',
    muted: '#9ca3af',
    danger: '#f87171',
    success: '#4ade80',
  },
};

export const useThemeStore = create<ThemeState>()((set, get) => ({
  isDarkMode: false,
  autoDeleteDuplicates: false,
  cacheVersion: 0,
  theme: lightTheme,

  toggleDarkMode: () => {
    const nextValue = !get().isDarkMode;
    set({
      isDarkMode: nextValue,
      theme: nextValue ? darkTheme : lightTheme,
    });
  },

  toggleAutoDeleteDuplicates: () => {
    set((state) => ({
      autoDeleteDuplicates: !state.autoDeleteDuplicates,
    }));
  },

  clearCache: async () => {
    useFilterStore.getState().resetFilters();
    useScreenshotStore.getState().clearSelection();

    set((state) => ({
      cacheVersion: state.cacheVersion + 1,
    }));
  },
}));
