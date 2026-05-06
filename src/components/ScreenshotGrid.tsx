import React, {useEffect, useMemo} from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type {AppTheme, Screenshot} from '../types';
import {SCREENSHOT_CARD_HEIGHT, ScreenshotCard} from './ScreenshotCard';
import {designTokens} from '../theme/tokens';

const GRID_GAP = designTokens.spacing.sm;
const GRID_ROW_HEIGHT = SCREENSHOT_CARD_HEIGHT + GRID_GAP;

interface ScreenshotGridProps {
  screenshots: Screenshot[];
  selectedIds: string[];
  selectionMode: boolean;
  isLoading: boolean;
  error: string | null;
  refreshing: boolean;
  theme: AppTheme;
  onPressItem: (item: Screenshot, index: number) => void;
  onLongPressItem: (item: Screenshot) => void;
  onDeleteItem?: (item: Screenshot) => void;
  onToggleFavoriteItem?: (item: Screenshot) => void;
  onRefresh: () => void;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyActionPress?: () => void;
  contentContainerStyle?: ViewStyle;
}

interface SkeletonCardProps {
  theme: AppTheme;
}

const SkeletonCard: React.FC<SkeletonCardProps> = ({theme}) => {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.85, {duration: 900}), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({opacity: opacity.value}));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {backgroundColor: theme.isDark ? '#262626' : '#e4e4e7'},
        animatedStyle,
      ]}
      accessibilityLabel="Loading screenshot"
    />
  );
};

export const ScreenshotGrid: React.FC<ScreenshotGridProps> = ({
  screenshots,
  selectedIds,
  selectionMode,
  isLoading,
  error,
  refreshing,
  theme,
  onPressItem,
  onLongPressItem,
  onDeleteItem,
  onToggleFavoriteItem,
  onRefresh,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyActionPress,
  contentContainerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const placeholderItems = useMemo(
    () => Array.from({length: 8}, (_, index) => `placeholder-${index}`),
    [],
  );

  const getItemLayout = (_: ArrayLike<Screenshot> | null | undefined, index: number) => {
    const row = Math.floor(index / 2);
    return {index, length: GRID_ROW_HEIGHT, offset: GRID_ROW_HEIGHT * row};
  };

  const renderItem: ListRenderItem<Screenshot> = ({item, index}) => (
    <View style={styles.itemWrapper}>
      <ScreenshotCard
        screenshot={item}
        isSelected={selectedSet.has(item.id)}
        selectionMode={selectionMode}
        theme={theme}
        onPress={() => onPressItem(item, index)}
        onLongPress={() => onLongPressItem(item)}
        onDelete={onDeleteItem ? () => onDeleteItem(item) : undefined}
        onToggleFavorite={onToggleFavoriteItem ? () => onToggleFavoriteItem(item) : undefined}
      />
    </View>
  );

  if (error && !isLoading) {
    return (
      <View
        style={[styles.centerState, {backgroundColor: theme.colors.background}]}
        accessibilityRole="alert">
        <View style={[styles.stateIconBox, {borderColor: theme.colors.danger, backgroundColor: theme.colors.dangerContainer}]}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={designTokens.iconSize.lg}
            color={theme.colors.danger}
          />
        </View>
        <Text style={[styles.stateTitle, {color: theme.colors.text}]}>
          Could not load screenshots
        </Text>
        <Text style={[styles.stateDescription, {color: theme.colors.muted}]}>{error}</Text>
        <Pressable
          style={[styles.stateButton, {borderColor: theme.colors.border}]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry loading screenshots">
          <Text style={[styles.stateButtonText, {color: theme.colors.text}]}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading && screenshots.length === 0) {
    return (
      <FlatList
        data={placeholderItems}
        keyExtractor={(item) => item}
        renderItem={() => (
          <View style={styles.itemWrapper}>
            <SkeletonCard theme={theme} />
          </View>
        )}
        numColumns={2}
        getItemLayout={(_, index) => {
          const row = Math.floor(index / 2);
          return {index, length: GRID_ROW_HEIGHT, offset: GRID_ROW_HEIGHT * row};
        }}
        windowSize={7}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        accessibilityLabel="Loading screenshots"
      />
    );
  }

  if (!isLoading && screenshots.length === 0) {
    return (
      <View style={[styles.centerState, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.stateIconBox, {borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant}]}>
          <MaterialCommunityIcons
            name="image-multiple-outline"
            size={designTokens.iconSize.lg}
            color={theme.colors.muted}
          />
        </View>
        <Text style={[styles.stateTitle, {color: theme.colors.text}]}>{emptyTitle}</Text>
        <Text style={[styles.stateDescription, {color: theme.colors.muted}]}>{emptyDescription}</Text>
        {emptyActionLabel && onEmptyActionPress ? (
          <Pressable
            style={[styles.stateButton, {borderColor: theme.colors.text, backgroundColor: theme.colors.text}]}
            onPress={onEmptyActionPress}
            accessibilityRole="button"
            accessibilityLabel={emptyActionLabel}>
            <Text style={[styles.stateButtonText, {color: theme.colors.surface}]}>
              {emptyActionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <FlatList
      data={screenshots}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={2}
      getItemLayout={getItemLayout}
      windowSize={11}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      initialNumToRender={10}
      updateCellsBatchingPeriod={50}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={[
        styles.listContent,
        {paddingBottom: selectionMode ? 140 + insets.bottom : 80 + insets.bottom},
        contentContainerStyle,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.muted}
          colors={[theme.colors.text]}
          progressBackgroundColor={theme.colors.surface}
        />
      }
      accessibilityLabel={`Screenshot grid with ${screenshots.length} items`}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: designTokens.spacing.md,
    paddingTop: designTokens.spacing.sm,
    gap: GRID_GAP,
  },
  columnWrapper: {
    gap: GRID_GAP,
  },
  itemWrapper: {
    flex: 1,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: designTokens.spacing.xxl,
    gap: designTokens.spacing.md,
  },
  stateIconBox: {
    width: 72,
    height: 72,
    borderRadius: designTokens.radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.xs,
  },
  stateTitle: {
    ...designTokens.typography.titleLarge,
    textAlign: 'center',
  },
  stateDescription: {
    ...designTokens.typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },
  stateButton: {
    marginTop: designTokens.spacing.xs,
    borderRadius: designTokens.radius.md,
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.sm,
    borderWidth: 1,
  },
  stateButtonText: {
    ...designTokens.typography.labelLarge,
  },
  skeleton: {
    height: SCREENSHOT_CARD_HEIGHT,
    borderRadius: designTokens.radius.lg,
  },
});
