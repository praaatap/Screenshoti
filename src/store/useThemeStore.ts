import {create} from 'zustand';
import type {AppTheme, ThemeState} from '../types';
import {designTokens} from '../theme/tokens';
import {useFilterStore} from './useFilterStore';
import {useScreenshotStore} from './useScreenshotStore';

const lightTheme: AppTheme = {
  isDark: false,
  colors: {
    background: designTokens.color.background,
    surface: designTokens.color.surface,
    text: designTokens.color.text,
    primary: designTokens.color.primary,
    border: designTokens.color.border,
    muted: designTokens.color.muted,
    danger: designTokens.color.danger,
    success: designTokens.color.success,
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
