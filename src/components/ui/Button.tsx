import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type {AppTheme} from '../../types';
import {designTokens} from '../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  theme: AppTheme;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

const sizeConfig = {
  sm: {
    paddingVertical: designTokens.spacing.xs,
    paddingHorizontal: designTokens.spacing.md,
    iconSize: designTokens.iconSize.xs,
    ...designTokens.typography.labelMedium,
  },
  md: {
    paddingVertical: designTokens.spacing.sm + 2,
    paddingHorizontal: designTokens.spacing.lg,
    iconSize: designTokens.iconSize.sm,
    ...designTokens.typography.labelLarge,
  },
  lg: {
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.xl,
    iconSize: designTokens.iconSize.md,
    ...designTokens.typography.titleMedium,
  },
};

function getVariantColors(variant: ButtonVariant, theme: AppTheme) {
  switch (variant) {
    case 'primary':
      return {
        bg: theme.colors.primary,
        text: '#ffffff',
        border: 'transparent',
      };
    case 'secondary':
      return {
        bg: 'transparent',
        text: theme.colors.primary,
        border: theme.colors.primary,
      };
    case 'ghost':
      return {
        bg: 'transparent',
        text: theme.colors.text,
        border: 'transparent',
      };
    case 'danger':
      return {
        bg: theme.colors.danger,
        text: '#ffffff',
        border: 'transparent',
      };
  }
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  theme,
  disabled = false,
  loading = false,
  fullWidth = false,
}) => {
  const scale = useSharedValue(1);
  const config = sizeConfig[size];
  const colors = getVariantColors(variant, theme);

  const gesture = Gesture.Tap()
    .enabled(!disabled && !loading)
    .onBegin(() => {
      scale.value = withSpring(0.95, {damping: 15});
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      onPress();
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: variant === 'secondary' ? 1.5 : 0,
            paddingVertical: config.paddingVertical,
            paddingHorizontal: config.paddingHorizontal,
            borderRadius: designTokens.radius.md,
            opacity: disabled ? 0.5 : 1,
          },
          variant === 'primary' && designTokens.elevation.low,
          fullWidth && styles.fullWidth,
          animatedStyle,
        ]}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.text}
          />
        ) : (
          <View style={styles.content}>
            {icon && (
              <MaterialCommunityIcons
                name={icon}
                size={config.iconSize}
                color={colors.text}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                {
                  color: colors.text,
                  fontSize: config.fontSize,
                  fontWeight: config.fontWeight,
                  lineHeight: config.lineHeight,
                },
              ]}>
              {label}
            </Text>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  icon: {
    marginRight: -2,
  },
});
