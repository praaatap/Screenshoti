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

const GRID_GAP = 12;
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
      />
    </View>
  );

  if (error && !isLoading) {
    return (
      <View style={[styles.centerState, {backgroundColor: theme.colors.background}]}> 
        <MaterialCommunityIcons name="alert-circle-outline" size={44} color={theme.colors.danger} />
        <Text style={[styles.stateTitle, {color: theme.colors.text}]}>Unable to load screenshots</Text>
        <Text style={[styles.stateDescription, {color: theme.colors.muted}]}>{error}</Text>
        <Pressable style={[styles.stateButton, {backgroundColor: theme.colors.primary}]} onPress={onRetry}>
          <Text style={styles.stateButtonLabel}>Retry</Text>
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
      />
    );
  }

  if (!isLoading && screenshots.length === 0) {
    return (
      <View style={[styles.centerState, {backgroundColor: theme.colors.background}]}> 
        <MaterialCommunityIcons name="image-off-outline" size={52} color={theme.colors.muted} />
        <Text style={[styles.stateTitle, {color: theme.colors.text}]}>{emptyTitle}</Text>
        <Text style={[styles.stateDescription, {color: theme.colors.muted}]}>{emptyDescription}</Text>
        {emptyActionLabel && onEmptyActionPress ? (
          <Pressable
            style={[styles.stateButton, {backgroundColor: theme.colors.primary}]}
            onPress={onEmptyActionPress}>
            <Text style={styles.stateButtonLabel}>{emptyActionLabel}</Text>
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
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
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
    paddingHorizontal: 26,
    gap: 10,
  },
  stateTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  stateButton: {
    marginTop: 8,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stateButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  skeleton: {
    height: SCREENSHOT_CARD_HEIGHT,
    borderRadius: 14,
  },
});
