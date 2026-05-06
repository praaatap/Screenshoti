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
    .onBegin(() => { scale.value = withSpring(0.92, {damping: 15}); })
    .onEnd(() => {
      scale.value = withSpring(1);
      if (onPress) { onPress(); }
    })
    .onFinalize(() => { scale.value = withSpring(1); });

  const animatedStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  const isFilter = variant === 'filter';

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          styles.chip,
          isFilter ? styles.chipFilter : styles.chipTag,
          {
            backgroundColor: isActive ? theme.colors.text : theme.colors.surfaceVariant,
            borderColor: isActive ? theme.colors.text : theme.colors.border,
          },
          animatedStyle,
        ]}>
        <View style={styles.content}>
          {icon && (
            <MaterialCommunityIcons
              name={icon}
              size={designTokens.iconSize.xs}
              color={isActive ? theme.colors.surface : theme.colors.muted}
            />
          )}
          <Text
            numberOfLines={1}
            style={[
              isFilter ? designTokens.typography.labelMedium : designTokens.typography.labelSmall,
              {color: isActive ? theme.colors.surface : theme.colors.text},
            ]}>
            {variant === 'tag' && !icon ? `#${label}` : label}
          </Text>
          {removable && (
            <MaterialCommunityIcons
              name="close"
              size={12}
              color={isActive ? theme.colors.surface : theme.colors.muted}
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
    borderRadius: designTokens.radius.full,
    borderWidth: 1,
  },
  chipFilter: {
    paddingVertical: designTokens.spacing.xs,
    paddingHorizontal: designTokens.spacing.md,
  },
  chipTag: {
    paddingVertical: designTokens.spacing.xxs + 2,
    paddingHorizontal: designTokens.spacing.sm,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
});
