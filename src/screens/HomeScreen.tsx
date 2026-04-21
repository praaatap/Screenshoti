import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Alert,
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';
import {BottomActionBar} from '../components/BottomActionBar';
import {ScreenshotGrid} from '../components/ScreenshotGrid';
import {useFilteredScreenshots} from '../hooks/useFilteredScreenshots';
import {usePermissions} from '../hooks/usePermissions';
import {useAlbumStore} from '../store/useAlbumStore';
import {useFilterStore} from '../store/useFilterStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import type {HomeScreenProps, RootStackParamList, Screenshot} from '../types';

export const HomeScreen: React.FC<HomeScreenProps> = () => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((state) => state.theme);
  const loadScreenshots = useScreenshotStore((state) => state.loadScreenshots);
  const screenshots = useScreenshotStore((state) => state.screenshots);
  const selectedScreenshots = useScreenshotStore((state) => state.selectedScreenshots);
  const selectScreenshot = useScreenshotStore((state) => state.selectScreenshot);
  const deselectScreenshot = useScreenshotStore((state) => state.deselectScreenshot);
  const clearSelection = useScreenshotStore((state) => state.clearSelection);
  const deleteMultiple = useScreenshotStore((state) => state.deleteMultiple);
  const moveToAlbum = useScreenshotStore((state) => state.moveToAlbum);
  const isLoading = useScreenshotStore((state) => state.isLoading);
  const error = useScreenshotStore((state) => state.error);

  const albums = useAlbumStore((state) => state.albums);

  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);

  const {filteredScreenshots} = useFilteredScreenshots();

  const {hasPhotoPermission, ensurePhotoPermission} = usePermissions();

  const [refreshing, setRefreshing] = useState(false);

  const selectionMode = selectedScreenshots.length > 0;

  const handleInitialLoad = useCallback(async () => {
    const granted = await ensurePhotoPermission();

    if (granted) {
      await loadScreenshots();
    }
  }, [ensurePhotoPermission, loadScreenshots]);

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

    Alert.alert('Delete selected', `Delete ${selectedScreenshots.length} screenshot(s)?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMultiple(selectedScreenshots);
          clearSelection();
        },
      },
    ]);
  }, [clearSelection, deleteMultiple, selectedScreenshots]);

  const handleMoveSelected = useCallback(() => {
    if (selectedScreenshots.length === 0) {
      return;
    }

    const targetAlbum = albums.find((album) => album.id !== 'all-screenshots');

    if (!targetAlbum) {
      Alert.alert('Create album first', 'Please create an album from the Albums tab before moving items.');
      return;
    }

    moveToAlbum(selectedScreenshots, targetAlbum.id);
    clearSelection();

    Alert.alert('Moved', `Moved ${selectedScreenshots.length} screenshot(s) to ${targetAlbum.name}.`);
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
      <View style={[styles.topBar, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
        <View
          style={[
            styles.searchInputWrap,
            {backgroundColor: theme.colors.background, borderColor: theme.colors.border},
          ]}>
          <MaterialCommunityIcons name="magnify" size={19} color={theme.colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={onSearchSubmit}
            placeholder="Search screenshots"
            placeholderTextColor={theme.colors.muted}
            style={[styles.searchInput, {color: theme.colors.text}]}
            returnKeyType="search"
          />
        </View>

        <Pressable style={styles.filterButton} onPress={openSearchScreen}>
          <MaterialCommunityIcons name="tune-variant" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      {!hasPhotoPermission && !isLoading ? (
        <View style={styles.permissionBanner}>
          <Text style={[styles.permissionText, {color: theme.colors.text}]}>Gallery permission is required.</Text>
          <Pressable
            style={[styles.permissionButton, {backgroundColor: theme.colors.primary}]}
            onPress={() => {
              void handleInitialLoad();
            }}>
            <Text style={styles.permissionButtonText}>Grant access</Text>
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
        onRefresh={handleRefresh}
        onRetry={() => {
          void handleInitialLoad();
        }}
        emptyTitle="No screenshots yet"
        emptyDescription="Import screenshots from your gallery to keep them organized in one place."
        emptyActionLabel="Import now"
        onEmptyActionPress={handleFabImport}
      />

      <BottomActionBar
        visible={selectionMode}
        selectedCount={selectedScreenshots.length}
        theme={theme}
        onDelete={handleDeleteSelected}
        onMoveToAlbum={handleMoveSelected}
        onShare={() => {
          void handleShareSelected();
        }}
      />

      <Pressable
        style={[styles.fab, {backgroundColor: theme.colors.primary}]}
        onPress={handleFabImport}
        accessibilityRole="button">
        <MaterialCommunityIcons name="import" size={24} color="#ffffff" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInputWrap: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  permissionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  permissionButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
