import React, {useEffect} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type {AppTheme} from '../types';

interface BottomActionBarProps {
  visible: boolean;
  selectedCount: number;
  theme: AppTheme;
  onDelete: () => void;
  onMoveToAlbum: () => void;
  onShare: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  visible,
  selectedCount,
  theme,
  onDelete,
  onMoveToAlbum,
  onShare,
}) => {
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 120, {duration: 220});
    opacity.value = withTiming(visible ? 1 : 0, {duration: 220});
  }, [opacity, translateY, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
    opacity: opacity.value,
  }));

  return (
    <AnimatedView
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        animatedStyle,
        {backgroundColor: theme.colors.surface, borderColor: theme.colors.border},
      ]}>
      <Text style={[styles.label, {color: theme.colors.text}]}>{selectedCount} selected</Text>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, {backgroundColor: theme.colors.background}]}
          onPress={onShare}>
          <MaterialCommunityIcons name="share-variant" size={20} color={theme.colors.text} />
          <Text style={[styles.actionText, {color: theme.colors.text}]}>Share</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, {backgroundColor: theme.colors.background}]}
          onPress={onMoveToAlbum}>
          <MaterialCommunityIcons name="folder-move" size={20} color={theme.colors.text} />
          <Text style={[styles.actionText, {color: theme.colors.text}]}>Move</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, {backgroundColor: '#fbe4e4'}]}
          onPress={onDelete}>
          <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.danger} />
          <Text style={[styles.actionText, {color: theme.colors.danger}]}>Delete</Text>
        </Pressable>
      </View>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 18,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
