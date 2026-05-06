import React from 'react';
import {StyleSheet, Text, Pressable, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
  FadeOutDown,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {designTokens} from '../theme/tokens';
import type {AppTheme} from '../types';

interface BottomActionBarProps {
  visible: boolean;
  selectedCount: number;
  theme: AppTheme;
  onDelete: () => void;
  onMoveToAlbum: () => void;
  onShare: () => void;
  onToggleFavorite: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

interface ActionItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  theme: AppTheme;
}

const ActionItem: React.FC<ActionItemProps> = ({icon, label, onPress, danger = false, theme}) => {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  return (
    <Animated.View style={[styles.actionItemOuter, aStyle]}>
      <Pressable
        style={styles.actionItem}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.88, {damping: 15}); }}
        onPressOut={() => { scale.value = withSpring(1, {damping: 15}); }}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <View style={[
          styles.actionIconBox,
          danger
            ? {backgroundColor: theme.colors.dangerContainer, borderColor: theme.colors.danger}
            : {backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border},
        ]}>
          <MaterialCommunityIcons
            name={icon}
            size={designTokens.iconSize.sm}
            color={danger ? theme.colors.danger : theme.colors.text}
          />
        </View>
        <Text style={[
          styles.actionLabel,
          {color: danger ? theme.colors.danger : theme.colors.muted},
        ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  visible,
  selectedCount,
  theme,
  onDelete,
  onMoveToAlbum,
  onShare,
  onToggleFavorite,
  onSelectAll,
  onClearSelection,
}) => {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown.duration(160)}
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: insets.bottom + designTokens.spacing.sm,
        },
      ]}>

      <View style={styles.topRow}>
        <View style={[styles.countPill, {backgroundColor: theme.colors.text}]}>
          <Text style={[styles.countText, {color: theme.colors.surface}]}>
            {selectedCount} selected
          </Text>
        </View>
        <View style={styles.topRowRight}>
          <Pressable
            onPress={onSelectAll}
            style={styles.topAction}
            accessibilityRole="button"
            accessibilityLabel="Select all">
            <Text style={[styles.topActionText, {color: theme.colors.text}]}>All</Text>
          </Pressable>
          <Pressable
            onPress={onClearSelection}
            style={[styles.closeButton, {borderColor: theme.colors.border}]}
            accessibilityRole="button"
            accessibilityLabel="Clear selection">
            <MaterialCommunityIcons
              name="close"
              size={designTokens.iconSize.xs}
              color={theme.colors.muted}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.actions}>
        <ActionItem icon="share-variant-outline" label="Share" theme={theme} onPress={onShare} />
        <ActionItem icon="folder-move-outline" label="Move" theme={theme} onPress={onMoveToAlbum} />
        <ActionItem icon="heart-outline" label="Fave" theme={theme} onPress={onToggleFavorite} />
        <ActionItem icon="delete-outline" label="Delete" theme={theme} onPress={onDelete} danger />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingTop: designTokens.spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.md,
  },
  countPill: {
    borderRadius: designTokens.radius.full,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xxs,
  },
  countText: {
    ...designTokens.typography.labelSmall,
  },
  topRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  topAction: {
    paddingHorizontal: designTokens.spacing.xs,
  },
  topActionText: {
    ...designTokens.typography.labelMedium,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: designTokens.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: designTokens.spacing.md,
    paddingTop: designTokens.spacing.xs,
  },
  actionItemOuter: {flex: 1},
  actionItem: {
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    paddingVertical: designTokens.spacing.sm,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...designTokens.typography.caption,
  },
});
