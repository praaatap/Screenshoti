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
    surfaceVariant: designTokens.color.surfaceVariant,
    text: designTokens.color.text,
    textSecondary: designTokens.color.textSecondary,
    primary: designTokens.color.primary,
    primaryContainer: designTokens.color.primaryContainer,
    onPrimaryContainer: designTokens.color.onPrimaryContainer,
    border: designTokens.color.border,
    outline: designTokens.color.outline,
    outlineVariant: designTokens.color.outlineVariant,
    muted: designTokens.color.muted,
    danger: designTokens.color.danger,
    dangerContainer: designTokens.color.dangerContainer,
    success: designTokens.color.success,
    successContainer: designTokens.color.successContainer,
    warning: designTokens.color.warning,
    warningContainer: designTokens.color.warningContainer,
    scrim: designTokens.color.scrim,
  },
};

const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: '#0d1117',
    surface: '#161b22',
    surfaceVariant: '#1c2333',
    text: '#f3f4f6',
    textSecondary: '#9ca3af',
    primary: '#34d399',
    primaryContainer: '#0d3d30',
    onPrimaryContainer: '#a7f3d0',
    border: '#2d3748',
    outline: '#4a5568',
    outlineVariant: '#2d3748',
    muted: '#9ca3af',
    danger: '#f87171',
    dangerContainer: '#3b1111',
    success: '#4ade80',
    successContainer: '#0d3320',
    warning: '#fbbf24',
    warningContainer: '#3d2e05',
    scrim: 'rgba(0,0,0,0.6)',
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
