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

// Dark: true monochrome — no color accents, white-on-black
const darkTheme: AppTheme = {
  isDark: true,
  colors: {
    background: '#0a0a0a',
    surface: '#141414',
    surfaceVariant: '#1c1c1c',
    text: '#fafafa',
    textSecondary: '#a1a1aa',
    primary: '#fafafa',
    primaryContainer: '#1c1c1c',
    onPrimaryContainer: '#fafafa',
    border: '#262626',
    outline: '#3f3f46',
    outlineVariant: '#1f1f1f',
    muted: '#71717a',
    danger: '#f87171',
    dangerContainer: '#1c0a0a',
    success: '#4ade80',
    successContainer: '#0a1c0f',
    warning: '#fbbf24',
    warningContainer: '#1c1408',
    scrim: 'rgba(0,0,0,0.7)',
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
