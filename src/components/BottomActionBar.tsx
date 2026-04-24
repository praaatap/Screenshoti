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
  onPress: () => void;
}

const ActionItem: React.FC<ActionItemProps> = ({icon, label, color, onPress}) => {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        style={styles.actionItem}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.88); }}
        onPressOut={() => { scale.value = withSpring(1); }}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
        <Text style={[styles.actionItemLabel, {color}]}>{label}</Text>
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
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutDown.duration(180)}
      style={[
        styles.bar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}>

      {/* Selection count pill + clear */}
      <View style={styles.topRow}>
        <View style={[styles.countPill, {backgroundColor: theme.colors.primary}]}>
          <Text style={styles.countText}>{selectedCount} selected</Text>
        </View>
        <View style={styles.topRowRight}>
          <Pressable onPress={onSelectAll} style={styles.topAction}>
            <Text style={[styles.topActionText, {color: theme.colors.primary}]}>Select all</Text>
          </Pressable>
          <Pressable onPress={onClearSelection} style={styles.topAction}>
            <MaterialCommunityIcons name="close" size={18} color={theme.colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.divider, {backgroundColor: theme.colors.border}]} />

      {/* Actions */}
      <View style={styles.actions}>
        <ActionItem icon="share-variant-outline" label="Share" color={theme.colors.text} onPress={onShare} />
        <ActionItem icon="folder-move-outline" label="Move" color={theme.colors.text} onPress={onMoveToAlbum} />
        <ActionItem icon="heart-outline" label="Favorite" color={theme.colors.primary} onPress={onToggleFavorite} />
        <ActionItem icon="delete-outline" label="Delete" color={theme.colors.danger} onPress={onDelete} />
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
    paddingTop: 10,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: -4},
    elevation: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  countPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  countText: {color: '#fff', fontSize: 12, fontWeight: '700'},
  topRowRight: {flexDirection: 'row', alignItems: 'center', gap: 8},
  topAction: {paddingHorizontal: 4},
  topActionText: {fontSize: 13, fontWeight: '600'},
  divider: {height: 1, marginHorizontal: 14, marginBottom: 8},
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  actionItem: {alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 6},
  actionItemLabel: {fontSize: 11, fontWeight: '600'},
});