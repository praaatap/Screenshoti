import {Platform, type TextStyle, type ViewStyle} from 'react-native';

export const designTokens = {
  color: {
    // Light palette — zinc-based monochrome
    background: '#fafafa',
    surface: '#ffffff',
    surfaceVariant: '#f4f4f5',
    text: '#09090b',
    textSecondary: '#71717a',
    primary: '#09090b',
    primaryContainer: '#f4f4f5',
    onPrimaryContainer: '#09090b',
    border: '#e4e4e7',
    outline: '#d4d4d8',
    outlineVariant: '#f0f0f0',
    muted: '#a1a1aa',
    danger: '#ef4444',
    dangerContainer: '#fef2f2',
    success: '#22c55e',
    successContainer: '#f0fdf4',
    warning: '#f59e0b',
    warningContainer: '#fffbeb',
    scrim: 'rgba(0,0,0,0.5)',
  },

  radius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    full: 9999,
  },

  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },

  iconSize: {
    xs: 14,
    sm: 18,
    md: 22,
    lg: 28,
    xl: 36,
  },

  typography: {
    displayLarge: {
      fontSize: 28,
      fontWeight: '800' as TextStyle['fontWeight'],
      lineHeight: 34,
      letterSpacing: -0.5,
    },
    headlineMedium: {
      fontSize: 20,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 26,
      letterSpacing: -0.3,
    },
    titleLarge: {
      fontSize: 16,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    titleMedium: {
      fontSize: 14,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 20,
      letterSpacing: -0.1,
    },
    bodyLarge: {
      fontSize: 15,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 22,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 20,
    },
    bodySmall: {
      fontSize: 13,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 18,
    },
    labelLarge: {
      fontSize: 13,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 18,
      letterSpacing: 0.1,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 16,
      letterSpacing: 0.1,
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 15,
      letterSpacing: 0.2,
    },
    caption: {
      fontSize: 10,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 14,
      letterSpacing: 0.2,
    },
    mono: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      fontSize: 12,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 18,
    },
  },

  // Flat elevation — borders, not shadows
  elevation: {
    none: {} as ViewStyle,
    low: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 1},
      },
      android: {elevation: 1},
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 1},
      },
    })!,
    medium: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
      },
      android: {elevation: 2},
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
      },
    })!,
    high: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 4},
      },
      android: {elevation: 4},
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 4},
      },
    })!,
  },
} as const;
