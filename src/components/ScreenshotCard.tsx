import React, {useEffect} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type {AppTheme, Screenshot} from '../types';
import {formatDate} from '../utils/formatters';

export const SCREENSHOT_CARD_HEIGHT = 208;

interface ScreenshotCardProps {
  screenshot: Screenshot;
  isSelected: boolean;
  selectionMode: boolean;
  theme: AppTheme;
  onPress: () => void;
  onLongPress: () => void;
}

export const ScreenshotCard: React.FC<ScreenshotCardProps> = ({
  screenshot,
  isSelected,
  selectionMode,
  theme,
  onPress,
  onLongPress,
}) => {
  const scale = useSharedValue(1);
  const checkboxOpacity = useSharedValue(selectionMode ? 1 : 0);

  useEffect(() => {
    checkboxOpacity.value = withTiming(selectionMode ? 1 : 0, {duration: 180});
  }, [checkboxOpacity, selectionMode]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const animatedCheckboxStyle = useAnimatedStyle(() => ({
    opacity: checkboxOpacity.value,
  }));

  const onPressIn = (): void => {
    scale.value = withTiming(0.95, {duration: 120});
  };

  const onPressOut = (): void => {
    scale.value = withTiming(1, {duration: 120});
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.pressable}>
      <Animated.View
        style={[
          styles.card,
          {backgroundColor: theme.colors.surface, borderColor: theme.colors.border},
          animatedCardStyle,
        ]}>
        <Image source={{uri: screenshot.uri}} style={styles.image} resizeMode="cover" />

        <View style={styles.meta}>
          <Text numberOfLines={1} style={[styles.fileName, {color: theme.colors.text}]}> 
            {screenshot.fileName}
          </Text>
          <Text style={[styles.date, {color: theme.colors.muted}]}>{formatDate(screenshot.createdAt)}</Text>
        </View>

        <Animated.View style={[styles.selectionLayer, animatedCheckboxStyle]}>
          <View
            style={[
              styles.checkbox,
              {
                borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                backgroundColor: isSelected ? theme.colors.primary : 'transparent',
              },
            ]}>
            {isSelected ? <MaterialCommunityIcons name="check" size={16} color="#ffffff" /> : null}
          </View>
        </Animated.View>

        {screenshot.isFavorite ? (
          <View style={[styles.favoriteBadge, {backgroundColor: theme.colors.surface}]}> 
            <MaterialCommunityIcons name="heart" size={16} color={theme.colors.primary} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
    height: SCREENSHOT_CARD_HEIGHT,
  },
  image: {
    width: '100%',
    height: 148,
    backgroundColor: '#d6dce4',
  },
  meta: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    fontWeight: '500',
  },
  selectionLayer: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 16,
    height: 28,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
