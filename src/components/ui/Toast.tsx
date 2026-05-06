import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Animated, {FadeInDown, FadeOutDown} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useToastStore, type ToastType} from '../../store/useToastStore';
import {useThemeStore} from '../../store/useThemeStore';
import {designTokens} from '../../theme/tokens';

const iconMap: Record<ToastType, string> = {
  success: 'check-circle-outline',
  error: 'alert-circle-outline',
  info: 'information-outline',
  warning: 'alert-outline',
};

export const Toast: React.FC = () => {
  const {visible, message, type} = useToastStore();
  const theme = useThemeStore((s) => s.theme);
  const insets = useSafeAreaInsets();

  if (!visible || !message) {return null;}

  const isDanger = type === 'error';

  return (
    <Animated.View
      entering={FadeInDown.duration(220).springify().damping(20)}
      exiting={FadeOutDown.duration(180)}
      style={[
        styles.container,
        {
          bottom: insets.bottom + designTokens.spacing.xxl,
          backgroundColor: isDanger ? theme.colors.dangerContainer : theme.colors.text,
          borderColor: isDanger ? theme.colors.danger : 'transparent',
        },
      ]}
      pointerEvents="none">
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={iconMap[type]}
          size={designTokens.iconSize.sm}
          color={isDanger ? theme.colors.danger : theme.colors.surface}
        />
        <Text
          style={[styles.message, {color: isDanger ? theme.colors.danger : theme.colors.surface}]}
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
    left: designTokens.spacing.xl,
    right: designTokens.spacing.xl,
    zIndex: 9999,
    borderRadius: designTokens.radius.lg,
    borderWidth: 1,
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  message: {
    ...designTokens.typography.bodySmall,
    flex: 1,
  },
});
