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
  color: string;
  bgColor: string;
  onPress: () => void;
}

const ActionItem: React.FC<ActionItemProps> = ({icon, label, color, bgColor, onPress}) => {
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
        <View style={[styles.actionIconCircle, {backgroundColor: bgColor}]}>
          <MaterialCommunityIcons name={icon} size={designTokens.iconSize.md} color={color} />
        </View>
        <Text style={[designTokens.typography.caption, {color}]}>{label}</Text>
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

  const glassBg = theme.isDark ? 'rgba(22,27,34,0.92)' : 'rgba(255,255,255,0.92)';

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutDown.duration(180)}
      style={[
        styles.bar,
        designTokens.elevation.high,
        {
          backgroundColor: glassBg,
          paddingBottom: Math.max(insets.bottom, designTokens.spacing.md),
        },
      ]}>

      <View style={styles.topRow}>
        <View style={[styles.countPill, {backgroundColor: theme.colors.primary}]}>
          <Text style={[designTokens.typography.labelSmall, {color: '#fff'}]}>{selectedCount} selected</Text>
        </View>
        <View style={styles.topRowRight}>
          <Pressable onPress={onSelectAll} style={styles.topAction} accessibilityRole="button" accessibilityLabel="Select all">
            <Text style={[designTokens.typography.labelMedium, {color: theme.colors.primary}]}>Select all</Text>
          </Pressable>
          <Pressable
            onPress={onClearSelection}
            style={[styles.closeButton, {backgroundColor: theme.colors.surfaceVariant}]}
            accessibilityRole="button"
            accessibilityLabel="Clear selection">
            <MaterialCommunityIcons name="close" size={designTokens.iconSize.sm} color={theme.colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.actions}>
        <ActionItem
          icon="share-variant-outline"
          label="Share"
          color={theme.colors.text}
          bgColor={theme.colors.surfaceVariant}
          onPress={onShare}
        />
        <ActionItem
          icon="folder-move-outline"
          label="Move"
          color={theme.colors.text}
          bgColor={theme.colors.surfaceVariant}
          onPress={onMoveToAlbum}
        />
        <ActionItem
          icon="heart-outline"
          label="Favorite"
          color={theme.colors.primary}
          bgColor={theme.colors.primaryContainer}
          onPress={onToggleFavorite}
        />
        <ActionItem
          icon="delete-outline"
          label="Delete"
          color={theme.colors.danger}
          bgColor={theme.colors.dangerContainer}
          onPress={onDelete}
        />
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
    borderTopLeftRadius: designTokens.radius.xl,
    borderTopRightRadius: designTokens.radius.xl,
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
    paddingVertical: designTokens.spacing.xs,
  },
  topRowRight: {flexDirection: 'row', alignItems: 'center', gap: designTokens.spacing.sm},
  topAction: {paddingHorizontal: designTokens.spacing.xs},
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: designTokens.radius.full,
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
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: designTokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
