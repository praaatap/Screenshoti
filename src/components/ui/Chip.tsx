import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type {AppTheme} from '../../types';
import {designTokens} from '../../theme/tokens';

type ChipVariant = 'filter' | 'tag';

interface ChipProps {
  label: string;
  isActive?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  icon?: string;
  removable?: boolean;
  onRemove?: () => void;
  theme: AppTheme;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  isActive = false,
  onPress,
  variant = 'filter',
  icon,
  removable = false,
  onRemove,
  theme,
}) => {
  const scale = useSharedValue(1);

  const gesture = Gesture.Tap()
    .enabled(!!onPress)
    .onBegin(() => {
      scale.value = withSpring(0.93, {damping: 15});
    })
    .onEnd(() => {
      scale.value = withSpring(1);
      if (onPress) { onPress(); }
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const isFilter = variant === 'filter';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.chip,
          {
            backgroundColor: isActive
              ? theme.colors.primary
              : isFilter
                ? theme.colors.surfaceVariant
                : 'transparent',
            borderColor: isActive
              ? theme.colors.primary
              : theme.colors.outline,
            borderWidth: isFilter ? 0 : 1,
            paddingVertical: isFilter
              ? designTokens.spacing.sm
              : designTokens.spacing.xs + 2,
            paddingHorizontal: isFilter
              ? designTokens.spacing.lg
              : designTokens.spacing.md,
            borderRadius: designTokens.radius.full,
          },
          animatedStyle,
        ]}>
        <View style={styles.content}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={designTokens.iconSize.xs}
              color={isActive ? '#ffffff' : theme.colors.muted}
              style={styles.icon}
            />
          )}
          <Text
            style={[
              isFilter
                ? designTokens.typography.labelMedium
                : designTokens.typography.labelSmall,
              {color: isActive ? '#ffffff' : theme.colors.text},
            ]}>
            {variant === 'tag' && !icon ? `#${label}` : label}
          </Text>
          {removable && (
            <MaterialCommunityIcons
              name="close-circle"
              size={designTokens.iconSize.xs}
              color={isActive ? '#ffffff' : theme.colors.muted}
              style={styles.removeIcon}
              onPress={onRemove}
            />
          )}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  icon: {
    marginRight: -2,
  },
  removeIcon: {
    marginLeft: 2,
  },
});
