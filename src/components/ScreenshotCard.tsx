import React, {useCallback} from 'react';
import {StyleSheet, Text, View, Image, Dimensions} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
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

export const SCREENSHOT_CARD_HEIGHT = 178;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
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

  // ── Swipe-to-delete gesture ───────────────────────────────────────────────
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      if (!onDelete || selectionMode) {
        return;
      }

      // Only allow left swipe
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
        // Fly out and delete
        translateX.value = withTiming(-SCREEN_WIDTH, {duration: 220});
        cardOpacity.value = withTiming(0, {duration: 200}, () => {
          runOnJS(onDelete)();
        });
      } else {
        // Snap back
        translateX.value = withSpring(0, {damping: 18, stiffness: 200});
      }
    });

  // ── Double-tap to favorite ─────────────────────────────────────────────────
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (selectionMode || !onToggleFavorite) {
        return;
      }

      runOnJS(onToggleFavorite)();
      heartScale.value = withSpring(1.4, {damping: 6}, () => {
        heartScale.value = withTiming(0, {duration: 300});
      });
    });

  // ── Single tap + long press ────────────────────────────────────────────────
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

  // ── Animated styles ────────────────────────────────────────────────────────
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{translateX: translateX.value}, {scale: pressScale.value}],
    opacity: cardOpacity.value,
  }));

  const deleteRevealStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.abs(translateX.value) / SWIPE_THRESHOLD, 1),
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{scale: heartScale.value}],
    opacity: heartScale.value,
  }));

  return (
    <View style={styles.wrapper}>
      {/* Delete reveal behind card */}
      <Animated.View style={[styles.deleteReveal, deleteRevealStyle]}>
        <MaterialCommunityIcons name="delete" size={28} color="#fff" />
        <Text style={styles.deleteRevealText}>Delete</Text>
      </Animated.View>

      <GestureDetector gesture={composed}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: isSelected ? theme.colors.primary : theme.colors.border,
              borderWidth: isSelected ? 2 : 1,
            },
            cardStyle,
          ]}>

          {/* Thumbnail */}
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
                {backgroundColor: isSelected ? `${theme.colors.primary}55` : 'transparent'},
              ]}>
              <View style={[
                styles.checkbox,
                {
                  backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                  borderColor: isSelected ? theme.colors.primary : '#fff',
                },
              ]}>
                {isSelected && (
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                )}
              </View>
            </Animated.View>
          )}

          {/* Favorite badge */}
          {screenshot.isFavorite && !selectionMode && (
            <View style={styles.favBadge}>
              <MaterialCommunityIcons name="heart" size={12} color="#f43f5e" />
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
              <MaterialCommunityIcons name="note-text" size={11} color={theme.colors.muted} />
            </View>
          )}

          {/* Double-tap heart burst */}
          <Animated.View style={[styles.heartBurst, heartStyle]} pointerEvents="none">
            <MaterialCommunityIcons name="heart" size={52} color="#f43f5e" />
          </Animated.View>

          {/* File name */}
          <View style={[styles.nameWrap, {backgroundColor: `${theme.colors.surface}e8`}]}>
            <Text numberOfLines={1} style={[styles.name, {color: theme.colors.text}]}>
              {truncateText(screenshot.fileName, 24)}
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
    backgroundColor: '#ef4444',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  deleteRevealText: {color: '#fff', fontSize: 11, fontWeight: '700'},
  card: {
    height: SCREENSHOT_CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {width: '100%', height: '100%', position: 'absolute'},
  selectionOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 14,
    padding: 6,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 3,
  },
  tagBadge: {
    position: 'absolute',
    top: 7,
    left: 7,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  tagBadgeText: {color: '#fff', fontSize: 9, fontWeight: '800'},
  noteBadge: {
    position: 'absolute',
    bottom: 32,
    right: 7,
    borderRadius: 8,
    padding: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
  },
  heartBurst: {
    position: 'absolute',
    alignSelf: 'center',
    top: '25%',
  },
  nameWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  name: {fontSize: 11, fontWeight: '600'},
});