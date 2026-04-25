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

const GRID_GAP = designTokens.spacing.md;
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
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, {duration: 750}), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {backgroundColor: theme.isDark ? '#2f3b4b' : '#dbe2eb'},
        animatedStyle,
      ]}
      accessibilityLabel="Loading screenshot"
    />
  );
};

interface FloatingIconProps {
  theme: AppTheme;
  icon: string;
}

const FloatingIcon: React.FC<FloatingIconProps> = ({theme, icon}) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-6, {duration: 1500}),
      -1,
      true,
    );
  }, [translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  return (
    <Animated.View
      style={[
        styles.emptyIconCircle,
        {backgroundColor: theme.colors.primaryContainer},
        animStyle,
      ]}>
      <MaterialCommunityIcons name={icon} size={designTokens.iconSize.xl} color={theme.colors.primary} />
    </Animated.View>
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
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const placeholderItems = useMemo(() => Array.from({length: 8}, (_, index) => `placeholder-${index}`), []);

  const getItemLayout = (_: ArrayLike<Screenshot> | null | undefined, index: number) => {
    const row = Math.floor(index / 2);
    return {
      index,
      length: GRID_ROW_HEIGHT,
      offset: GRID_ROW_HEIGHT * row,
    };
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
      <View style={[styles.centerState, {backgroundColor: theme.colors.background}]} accessibilityRole="alert">
        <View style={[styles.emptyIconCircle, {backgroundColor: theme.colors.dangerContainer}]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={designTokens.iconSize.xl} color={theme.colors.danger} />
        </View>
        <Text style={[designTokens.typography.headlineMedium, styles.stateTitle, {color: theme.colors.text}]}>
          Unable to load screenshots
        </Text>
        <Text style={[designTokens.typography.bodyMedium, styles.stateDescription, {color: theme.colors.muted}]}>
          {error}
        </Text>
        <Pressable
          style={[styles.stateButton, {backgroundColor: theme.colors.primary}]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry loading screenshots">
          <MaterialCommunityIcons name="refresh" size={designTokens.iconSize.sm} color="#ffffff" />
          <Text style={[designTokens.typography.labelLarge, {color: '#ffffff'}]}>Retry</Text>
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
          return {
            index,
            length: GRID_ROW_HEIGHT,
            offset: GRID_ROW_HEIGHT * row,
          };
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
        <FloatingIcon theme={theme} icon="image-multiple-outline" />
        <Text style={[designTokens.typography.headlineMedium, styles.stateTitle, {color: theme.colors.text}]}>
          {emptyTitle}
        </Text>
        <Text style={[designTokens.typography.bodyMedium, styles.stateDescription, {color: theme.colors.muted}]}>
          {emptyDescription}
        </Text>
        {emptyActionLabel && onEmptyActionPress ? (
          <Pressable
            style={[styles.stateButton, {backgroundColor: theme.colors.primary}]}
            onPress={onEmptyActionPress}
            accessibilityRole="button"
            accessibilityLabel={emptyActionLabel}>
            <MaterialCommunityIcons name="import" size={designTokens.iconSize.sm} color="#ffffff" />
            <Text style={[designTokens.typography.labelLarge, {color: '#ffffff'}]}>{emptyActionLabel}</Text>
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
      maxToRenderPerBatch={12}
      initialNumToRender={12}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={[
        styles.listContent,
        {paddingBottom: selectionMode ? 132 : 88},
        contentContainerStyle,
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
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
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  stateTitle: {
    textAlign: 'center',
  },
  stateDescription: {
    textAlign: 'center',
    lineHeight: 22,
  },
  stateButton: {
    marginTop: designTokens.spacing.sm,
    borderRadius: designTokens.radius.md,
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  skeleton: {
    height: SCREENSHOT_CARD_HEIGHT,
    borderRadius: designTokens.radius.lg,
  },
});
