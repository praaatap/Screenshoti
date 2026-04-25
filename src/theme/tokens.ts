import {Platform, type TextStyle, type ViewStyle} from 'react-native';

export const designTokens = {
  color: {
    background: '#f8f9fb',
    surface: '#ffffff',
    surfaceVariant: '#f1f3f5',
    text: '#191c1e',
    textSecondary: '#5e6572',
    primary: '#0b7a75',
    primaryContainer: '#d5f0ee',
    onPrimaryContainer: '#053533',
    border: '#e1e2e4',
    outline: '#c4c6c8',
    outlineVariant: '#e8eaec',
    muted: '#5e6572',
    danger: '#dc2626',
    dangerContainer: '#fde8e8',
    success: '#2b8a3e',
    successContainer: '#d4edda',
    warning: '#d97706',
    warningContainer: '#fef3cd',
    scrim: 'rgba(0,0,0,0.4)',
  },

  radius: {
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 28,
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
      lineHeight: 36,
    },
    headlineMedium: {
      fontSize: 20,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 28,
    },
    titleLarge: {
      fontSize: 17,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 24,
    },
    titleMedium: {
      fontSize: 15,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 22,
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
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 18,
    },
    labelMedium: {
      fontSize: 12,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 16,
    },
    labelSmall: {
      fontSize: 11,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 16,
    },
    caption: {
      fontSize: 10,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 14,
    },
  },

  elevation: {
    none: {
      shadowColor: 'transparent',
      shadowOpacity: 0,
      shadowRadius: 0,
      shadowOffset: {width: 0, height: 0},
      elevation: 0,
    } as ViewStyle,
    low: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
      },
      android: {
        elevation: 2,
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
      },
    })!,
    medium: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 4},
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: {width: 0, height: 4},
      },
    })!,
    high: Platform.select<ViewStyle>({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: {width: 0, height: 8},
      },
      android: {
        elevation: 12,
      },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 24,
        shadowOffset: {width: 0, height: 8},
      },
    })!,
  },
} as const;
