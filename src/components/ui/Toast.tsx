import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {FadeInUp, FadeOutUp} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToastStore, type ToastType} from '../../store/useToastStore';
import {useThemeStore} from '../../store/useThemeStore';
import {designTokens} from '../../theme/tokens';

const toastConfig: Record<ToastType, {icon: string; lightBg: string; darkBg: string; lightText: string; darkText: string}> = {
  success: {icon: 'check-circle', lightBg: '#d4edda', darkBg: '#0d3320', lightText: '#155724', darkText: '#4ade80'},
  error: {icon: 'alert-circle', lightBg: '#fde8e8', darkBg: '#3b1111', lightText: '#991b1b', darkText: '#f87171'},
  info: {icon: 'information', lightBg: '#d1ecf1', darkBg: '#0c2d3e', lightText: '#0c5460', darkText: '#67d7e8'},
  warning: {icon: 'alert', lightBg: '#fef3cd', darkBg: '#3d2e05', lightText: '#856404', darkText: '#fbbf24'},
};

export const Toast: React.FC = () => {
  const {visible, message, type} = useToastStore();
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();

  if (!visible || !message) {return null;}

  const config = toastConfig[type];
  const bgColor = theme.isDark ? config.darkBg : config.lightBg;
  const textColor = theme.isDark ? config.darkText : config.lightText;

  return (
    <Animated.View
      entering={FadeInUp.duration(250).springify().damping(18)}
      exiting={FadeOutUp.duration(200)}
      style={[
        styles.container,
        designTokens.elevation.medium,
        {
          top: insets.top + designTokens.spacing.sm,
          backgroundColor: bgColor,
        },
      ]}
      pointerEvents="none">
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={config.icon}
          size={designTokens.iconSize.md}
          color={textColor}
        />
        <Text
          style={[
            designTokens.typography.bodySmall,
            {color: textColor, flex: 1},
          ]}
          numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: designTokens.spacing.lg,
    right: designTokens.spacing.lg,
    zIndex: 9999,
    borderRadius: designTokens.radius.md,
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.md,
  },
});
