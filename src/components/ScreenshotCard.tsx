import React, {useCallback} from 'react';
import {Dimensions, StyleSheet, Text, View, Image} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type {AppTheme, Screenshot} from '../types';
import {truncateText} from '../utils/formatters';
import {designTokens} from '../theme/tokens';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - designTokens.spacing.md * 2 - designTokens.spacing.md) / 2;
export const SCREENSHOT_CARD_HEIGHT = Math.round(COLUMN_WIDTH * 1.33);
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface ScreenshotCardProps {
  screenshot: Screenshot;
  isSelected: boolean;
  selectionMode: boolean;
  theme: AppTheme;
  onPress: () => void;
  onLongPress: () => void;
  onDelete?: () => void;
  onToggleFavorite?: () => void;
}

export const ScreenshotCard: React.FC<ScreenshotCardProps> = ({
  screenshot,
  isSelected,
  selectionMode,
  theme,
  onPress,
  onLongPress,
  onDelete,
  onToggleFavorite,
}) => {
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const heartScale = useSharedValue(0);
  const pressScale = useSharedValue(1);

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (!onDelete || selectionMode) {return;}
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (!onDelete || selectionMode) {
        translateX.value = withSpring(0, {damping: 18, stiffness: 200});
        return;
      }
      if (e.translationX < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-SCREEN_WIDTH, {duration: 220});
        cardOpacity.value = withTiming(0, {duration: 200}, () => {
          runOnJS(onDelete)();
        });
      } else {
        translateX.value = withSpring(0, {damping: 18, stiffness: 200});
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (selectionMode || !onToggleFavorite) {return;}
      runOnJS(onToggleFavorite)();
      heartScale.value = withSpring(1.6, {damping: 6}, () => {
        heartScale.value = withSpring(1, {damping: 10}, () => {
          heartScale.value = withTiming(0, {duration: 300});
        });
      });
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onBegin(() => { pressScale.value = withSpring(0.95, {damping: 15}); })
    .onEnd(() => {
      pressScale.value = withSpring(1);
      runOnJS(onPress)();
    })
    .onFinalize(() => { pressScale.value = withSpring(1); });

  const longPressGesture = Gesture.LongPress()
    .minDuration(380)
    .onEnd(() => { runOnJS(onLongPress)(); });

  const composed = Gesture.Exclusive(
    doubleTapGesture,
    Gesture.Simultaneous(tapGesture, longPressGesture),
    swipeGesture,
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}, {scale: pressScale.value}],
    opacity: cardOpacity.value,
  }));

  const deleteRevealStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1);
    const rotate = interpolate(progress, [0, 1], [0, -15]);
    const scale = interpolate(progress, [0, 0.5, 1], [0.8, 1, 1.15]);
    return {
      opacity: progress,
      transform: [{rotate: `${rotate}deg`}, {scale}],
    };
  });

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{scale: heartScale.value}],
    opacity: heartScale.value,
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.deleteReveal, deleteRevealStyle]}>
        <MaterialCommunityIcons name="delete" size={designTokens.iconSize.lg} color="#fff" />
        <Text style={styles.deleteRevealText}>Delete</Text>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.card,
            designTokens.elevation.low,
            {backgroundColor: theme.colors.surface},
            isSelected && {borderWidth: 2, borderColor: theme.colors.primary},
            cardStyle,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${screenshot.fileName}${screenshot.isFavorite ? ', favorited' : ''}${screenshot.tags.length > 0 ? `, ${screenshot.tags.length} tags` : ''}`}
          accessibilityHint={selectionMode ? 'Tap to toggle selection' : 'Tap to view, double tap to favorite'}
          accessibilityState={{selected: isSelected}}>

          <Image
            source={{uri: screenshot.uri}}
            style={styles.thumbnail}
            resizeMode="cover"
          />

          {/* Selection overlay */}
          {selectionMode && (
            <Animated.View
              entering={ZoomIn.duration(150)}
              style={[
                styles.selectionOverlay,
                {backgroundColor: isSelected ? `${theme.colors.primary}44` : 'transparent'},
              ]}>
              <View style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                  borderColor: isSelected ? theme.colors.primary : '#fff',
                },
              ]}>
                {isSelected && (
                  <MaterialCommunityIcons name="check" size={designTokens.iconSize.xs} color="#fff" />
                )}
              </View>
            </Animated.View>
          )}

          {/* Favorite badge */}
          {screenshot.isFavorite && !selectionMode && (
            <View style={styles.favBadge}>
              <MaterialCommunityIcons name="heart" size={designTokens.iconSize.xs} color="#f43f5e" />
            </View>
          )}

          {/* Tag count badge */}
          {screenshot.tags.length > 0 && !selectionMode && (
            <View style={[styles.tagBadge, {backgroundColor: theme.colors.primary}]}>
              <Text style={styles.tagBadgeText}>{screenshot.tags.length}</Text>
            </View>
          )}

          {/* Note indicator */}
          {screenshot.note && !selectionMode && (
            <View style={[styles.noteBadge, {backgroundColor: theme.colors.surface}]}>
              <MaterialCommunityIcons name="note-text" size={designTokens.iconSize.xs} color={theme.colors.muted} />
            </View>
          )}

          {/* Double-tap heart burst */}
          <Animated.View style={[styles.heartBurst, heartStyle]} pointerEvents="none">
            <MaterialCommunityIcons name="heart" size={designTokens.iconSize.xl + 16} color="#f43f5e" />
          </Animated.View>

          {/* Gradient overlay for text */}
          <View style={styles.gradientOverlay}>
            <View style={styles.gradientLayer1} />
            <View style={styles.gradientLayer2} />
            <View style={styles.gradientLayer3} />
          </View>

          {/* File name */}
          <View style={styles.nameWrap}>
            <Text numberOfLines={1} style={styles.nameText}>
              {truncateText(screenshot.fileName, 28)}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {flex: 1, position: 'relative'},
  deleteReveal: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: designTokens.color.danger,
    borderRadius: designTokens.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.xs,
  },
  deleteRevealText: {
    color: '#fff',
    ...designTokens.typography.labelSmall,
  },
  card: {
    height: SCREENSHOT_CARD_HEIGHT,
    borderRadius: designTokens.radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFill,
    padding: designTokens.spacing.sm,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: designTokens.radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: designTokens.spacing.sm,
    right: designTokens.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: designTokens.radius.full,
    padding: designTokens.spacing.xs,
  },
  tagBadge: {
    position: 'absolute',
    top: designTokens.spacing.sm,
    left: designTokens.spacing.sm,
    borderRadius: designTokens.radius.full,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xxs,
    minWidth: 22,
    alignItems: 'center',
  },
  tagBadgeText: {
    color: '#fff',
    ...designTokens.typography.labelSmall,
  },
  noteBadge: {
    position: 'absolute',
    bottom: 36,
    right: designTokens.spacing.sm,
    borderRadius: designTokens.radius.sm,
    padding: designTokens.spacing.xs,
    ...designTokens.elevation.low,
  },
  heartBurst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '25%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
  },
  gradientLayer1: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  gradientLayer2: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  gradientLayer3: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  nameWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
  },
  nameText: {
    color: '#ffffff',
    ...designTokens.typography.labelSmall,
  },
});
