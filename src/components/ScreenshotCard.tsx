import React from 'react';
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

const ScreenshotCardInner: React.FC<ScreenshotCardProps> = ({
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
    .onBegin(() => { pressScale.value = withSpring(0.96, {damping: 15}); })
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
    const rotate = interpolate(progress, [0, 1], [0, -10]);
    const scale = interpolate(progress, [0, 0.5, 1], [0.8, 1, 1.1]);
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
      {/* Swipe-to-delete reveal */}
      <Animated.View style={[styles.deleteReveal, deleteRevealStyle]}>
        <MaterialCommunityIcons name="delete" size={designTokens.iconSize.md} color="#fff" />
        <Text style={styles.deleteRevealText}>Delete</Text>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <Animated.View
          entering={FadeIn.duration(180)}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: isSelected ? theme.colors.text : theme.colors.border,
              borderWidth: isSelected ? 2 : 1,
            },
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
              entering={ZoomIn.duration(120)}
              style={[
                styles.selectionOverlay,
                {backgroundColor: isSelected ? 'rgba(0,0,0,0.35)' : 'transparent'},
              ]}>
              <View style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? theme.colors.surface : 'transparent',
                  borderColor: '#fff',
                  borderWidth: 2,
                },
              ]}>
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check"
                    size={designTokens.iconSize.xs}
                    color={theme.colors.text}
                  />
                )}
              </View>
            </Animated.View>
          )}

          {/* Favorite badge */}
          {screenshot.isFavorite && !selectionMode && (
            <View style={styles.favBadge}>
              <MaterialCommunityIcons name="heart" size={10} color="#09090b" />
            </View>
          )}

          {/* Tag count badge */}
          {screenshot.tags.length > 0 && !selectionMode && (
            <View style={[styles.tagBadge, {backgroundColor: theme.colors.surface}]}>
              <Text style={[styles.tagBadgeText, {color: theme.colors.text}]}>
                {screenshot.tags.length}
              </Text>
            </View>
          )}

          {/* Double-tap heart burst */}
          <Animated.View style={[styles.heartBurst, heartStyle]} pointerEvents="none">
            <MaterialCommunityIcons name="heart" size={52} color="#fff" />
          </Animated.View>

          {/* Bottom name strip */}
          <View style={[styles.nameStrip, {backgroundColor: theme.isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.6)'}]}>
            <Text numberOfLines={1} style={styles.nameText}>
              {truncateText(screenshot.fileName, 26)}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export const ScreenshotCard = React.memo(ScreenshotCardInner, (prev, next) => {
  return (
    prev.screenshot.id === next.screenshot.id &&
    prev.isSelected === next.isSelected &&
    prev.selectionMode === next.selectionMode &&
    prev.screenshot.isFavorite === next.screenshot.isFavorite &&
    prev.screenshot.tags.length === next.screenshot.tags.length &&
    prev.theme === next.theme
  );
});

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
    width: 22,
    height: 22,
    borderRadius: designTokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: designTokens.spacing.sm,
    right: designTokens.spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: designTokens.radius.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagBadge: {
    position: 'absolute',
    top: designTokens.spacing.sm,
    left: designTokens.spacing.sm,
    borderRadius: designTokens.radius.xs,
    paddingHorizontal: designTokens.spacing.xs,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tagBadgeText: {
    ...designTokens.typography.caption,
  },
  heartBurst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '25%',
  },
  nameStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
  },
  nameText: {
    color: '#ffffff',
    ...designTokens.typography.caption,
  },
});
