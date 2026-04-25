import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';
import {BottomActionBar} from '../components/BottomActionBar';
import {ScreenshotGrid} from '../components/ScreenshotGrid';
import {useFilteredScreenshots} from '../hooks/useFilteredScreenshots';
import {usePermissions} from '../hooks/usePermissions';
import {trackEvent} from '../services/observability/analytics';
import {useAlbumStore} from '../store/useAlbumStore';
import {useFilterStore} from '../store/useFilterStore';
import {useIntelligenceStore} from '../store/useIntelligenceStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import {useToastStore} from '../store/useToastStore';
import {ConfirmationSheet} from '../components/ui/ConfirmationSheet';
import {designTokens} from '../theme/tokens';
import type {HomeScreenProps, RootStackParamList, Screenshot} from '../types';

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((state) => state.theme);
  const fabScale = useSharedValue(1);
  const fabStyle = useAnimatedStyle(() => ({transform: [{scale: fabScale.value}]}));
  const loadScreenshots = useScreenshotStore((state) => state.loadScreenshots);
  const screenshots = useScreenshotStore((state) => state.screenshots);
  const selectedScreenshots = useScreenshotStore((state) => state.selectedScreenshots);
  const selectScreenshot = useScreenshotStore((state) => state.selectScreenshot);
  const deselectScreenshot = useScreenshotStore((state) => state.deselectScreenshot);
  const clearSelection = useScreenshotStore((state) => state.clearSelection);
  const deleteMultiple = useScreenshotStore((state) => state.deleteMultiple);
  const deleteScreenshot = useScreenshotStore((state) => state.deleteScreenshot);
  const moveToAlbum = useScreenshotStore((state) => state.moveToAlbum);
  const toggleFavorite = useScreenshotStore((state) => state.toggleFavorite);
  const selectAll = useScreenshotStore((state) => state.selectAll);
  const isLoading = useScreenshotStore((state) => state.isLoading);
  const error = useScreenshotStore((state) => state.error);
  const reindex = useIntelligenceStore((state) => state.reindex);

  const albums = useAlbumStore((state) => state.albums);

  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);

  const {filteredScreenshots} = useFilteredScreenshots();

  const {isGranted, isLimited, ensurePhotoPermission} = usePermissions();
  const showToast = useToastStore((state) => state.show);

  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  const selectionMode = selectedScreenshots.length > 0;
  const favoriteCount = useMemo(() => screenshots.filter((shot) => shot.isFavorite).length, [screenshots]);

  const handleInitialLoad = useCallback(async () => {
    const granted = await ensurePhotoPermission();

    if (granted) {
      await loadScreenshots();
      trackEvent('home_load_screenshots', {granted});
    }
  }, [ensurePhotoPermission, loadScreenshots]);

  useEffect(() => {
    if (screenshots.length === 0) {
      return;
    }

    reindex(screenshots);
  }, [reindex, screenshots]);

  useEffect(() => {
    void handleInitialLoad();
  }, [handleInitialLoad]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleInitialLoad();
    setRefreshing(false);
  }, [handleInitialLoad]);

  const toggleSelection = useCallback(
    (id: string) => {
      if (selectedScreenshots.includes(id)) {
        deselectScreenshot(id);
      } else {
        selectScreenshot(id);
      }
    },
    [deselectScreenshot, selectScreenshot, selectedScreenshots],
  );

  const handleLongPressItem = useCallback(
    (item: Screenshot) => {
      toggleSelection(item.id);
    },
    [toggleSelection],
  );

  const handlePressItem = useCallback(
    (item: Screenshot) => {
      if (selectionMode) {
        toggleSelection(item.id);
        return;
      }

      rootNavigation.navigate('Detail', {screenshotId: item.id});
    },
    [rootNavigation, selectionMode, toggleSelection],
  );

  const selectedUris = useMemo(() => {
    if (!selectionMode) {
      return [] as string[];
    }

    const selectedSet = new Set(selectedScreenshots);
    return screenshots.filter((shot) => selectedSet.has(shot.id)).map((shot) => shot.uri);
  }, [screenshots, selectedScreenshots, selectionMode]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedScreenshots.length === 0) {
      return;
    }
    setShowDeleteSheet(true);
  }, [selectedScreenshots]);

  const confirmDeleteSelected = useCallback(() => {
    deleteMultiple(selectedScreenshots);
    clearSelection();
    showToast(`Deleted ${selectedScreenshots.length} screenshot(s).`, 'success');
  }, [clearSelection, deleteMultiple, selectedScreenshots, showToast]);

  const handleMoveSelected = useCallback(() => {
    if (selectedScreenshots.length === 0) {
      return;
    }

    const targetAlbum = albums.find((album) => album.id !== 'all-screenshots');

    if (!targetAlbum) {
      showToast('Create an album from the Albums tab first.', 'warning');
      return;
    }

    moveToAlbum(selectedScreenshots, targetAlbum.id);
    clearSelection();

    showToast(`Moved ${selectedScreenshots.length} screenshot(s) to ${targetAlbum.name}.`, 'success');
  }, [albums, clearSelection, moveToAlbum, selectedScreenshots]);

  const handleShareSelected = useCallback(async () => {
    if (selectedUris.length === 0) {
      return;
    }

    try {
      await Share.open({urls: selectedUris});
      clearSelection();
    } catch {
      // Share dialog dismiss is a normal case.
    }
  }, [clearSelection, selectedUris]);

  const handleFavoriteSelected = useCallback(() => {
    if (selectedScreenshots.length === 0) {
      return;
    }

    selectedScreenshots.forEach((id) => {
      toggleFavorite(id);
    });

    clearSelection();
  }, [clearSelection, selectedScreenshots, toggleFavorite]);

  const handleSelectAllVisible = useCallback(() => {
    if (filteredScreenshots.length === screenshots.length) {
      selectAll();
      return;
    }

    clearSelection();
    filteredScreenshots.forEach((shot) => {
      selectScreenshot(shot.id);
    });
  }, [clearSelection, filteredScreenshots, screenshots.length, selectAll, selectScreenshot]);

  const onSearchSubmit = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>): void => {
    setSearchQuery(event.nativeEvent.text);
  };

  const openSearchScreen = (): void => {
    rootNavigation.navigate('Search');
  };

  const handleFabImport = (): void => {
    void handleRefresh();
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Compact header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[designTokens.typography.titleLarge, {color: theme.colors.text}]}>Screenshoti</Text>
          <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>
            {screenshots.length} shots{favoriteCount > 0 ? ` · ${favoriteCount} faves` : ''}{albums.length > 1 ? ` · ${albums.length - 1} albums` : ''}
          </Text>
        </View>
        <Pressable
          style={[styles.headerIconButton, {backgroundColor: theme.colors.surfaceVariant}]}
          onPress={openSearchScreen}>
          <MaterialCommunityIcons name="magnify" size={designTokens.iconSize.md} color={theme.colors.text} />
        </Pressable>
      </View>

      {/* Inline search bar */}
      <View style={styles.searchBar}>
        <View
          style={[
            styles.searchInputWrap,
            designTokens.elevation.low,
            {backgroundColor: theme.colors.surface},
          ]}>
          <MaterialCommunityIcons name="magnify" size={designTokens.iconSize.sm} color={theme.colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={onSearchSubmit}
            placeholder="Search screenshots..."
            placeholderTextColor={theme.colors.muted}
            style={[designTokens.typography.bodyMedium, styles.searchInput, {color: theme.colors.text}]}
            returnKeyType="search"
          />
          <Pressable onPress={openSearchScreen} hitSlop={8}>
            <MaterialCommunityIcons name="tune-variant" size={designTokens.iconSize.sm} color={theme.colors.muted} />
          </Pressable>
        </View>
      </View>

      {!isGranted && !isLimited && !isLoading ? (
        <View style={styles.permissionBanner}>
          <Text style={[designTokens.typography.bodySmall, {color: theme.colors.text}]}>Gallery permission is required.</Text>
          <Pressable
            style={[styles.permissionButton, {backgroundColor: theme.colors.primary}]}
            onPress={() => {
              void handleInitialLoad();
            }}>
            <Text style={[designTokens.typography.labelMedium, {color: '#ffffff'}]}>Grant access</Text>
          </Pressable>
        </View>
      ) : null}

      <ScreenshotGrid
        screenshots={filteredScreenshots}
        selectedIds={selectedScreenshots}
        selectionMode={selectionMode}
        isLoading={isLoading}
        error={error}
        refreshing={refreshing}
        theme={theme}
        onPressItem={(item) => {
          handlePressItem(item);
        }}
        onLongPressItem={handleLongPressItem}
        onDeleteItem={(item) => {
          deleteScreenshot(item.id);
        }}
        onToggleFavoriteItem={(item) => {
          toggleFavorite(item.id);
        }}
        onRefresh={handleRefresh}
        onRetry={() => {
          void handleInitialLoad();
        }}
        emptyTitle="Your gallery is waiting"
        emptyDescription="Import screenshots from your gallery to organize, search, and tag them."
        emptyActionLabel="Import now"
        onEmptyActionPress={handleFabImport}
      />

      <BottomActionBar
        visible={selectionMode}
        selectedCount={selectedScreenshots.length}
        theme={theme}
        onDelete={handleDeleteSelected}
        onMoveToAlbum={handleMoveSelected}
        onToggleFavorite={handleFavoriteSelected}
        onSelectAll={handleSelectAllVisible}
        onClearSelection={clearSelection}
        onShare={() => {
          void handleShareSelected();
        }}
      />

      <Animated.View style={[styles.fab, {backgroundColor: theme.colors.primary}, designTokens.elevation.medium, fabStyle]}>
        <Pressable
          style={styles.fabInner}
          onPress={handleFabImport}
          onPressIn={() => { fabScale.value = withSpring(0.88, {damping: 15}); }}
          onPressOut={() => { fabScale.value = withSpring(1, {damping: 12}); }}
          accessibilityRole="button"
          accessibilityLabel="Import screenshots from gallery">
          <MaterialCommunityIcons name="import" size={designTokens.iconSize.md} color="#ffffff" />
        </Pressable>
      </Animated.View>

      <ConfirmationSheet
        visible={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)}
        onConfirm={confirmDeleteSelected}
        theme={theme}
        title="Delete selected"
        description={`Delete ${selectedScreenshots.length} screenshot(s)? This can't be undone.`}
        confirmLabel="Delete"
        icon="delete-outline"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
    gap: designTokens.spacing.xxs,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
  },
  searchInputWrap: {
    borderRadius: designTokens.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    right: designTokens.spacing.xl,
    bottom: designTokens.spacing.xxxl,
    width: 56,
    height: 56,
    borderRadius: designTokens.radius.full,
    overflow: 'hidden',
  },
  fabInner: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
  },
  permissionButton: {
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
  },
});
