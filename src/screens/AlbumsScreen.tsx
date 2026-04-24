import React, {useCallback, useMemo, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useShallow} from 'zustand/react/shallow';
import {useAlbumStore} from '../store/useAlbumStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import type {Album, AlbumsScreenProps, RootStackParamList} from '../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const ALBUM_ROW_HEIGHT = 200;
const ALBUM_COLORS = ['#0b7a75', '#7c3aed', '#c2410c', '#0369a1', '#b45309', '#15803d'];

type SortMode = 'name' | 'count' | 'date';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AlbumWithComputedFields extends Album {
  computedCount: number;
  computedCoverUri: string | null;
  accentColor: string;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface AlbumCardProps {
  item: AlbumWithComputedFields;
  theme: ReturnType<typeof useThemeStore.getState>['theme'];
  onPress: () => void;
  onLongPress: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({item, theme, onPress, onLongPress}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
  }));

  const handlePressIn = () => { scale.value = withSpring(0.96, {damping: 15}); };
  const handlePressOut = () => { scale.value = withSpring(1, {damping: 15}); };

  return (
    <Animated.View style={[styles.albumCardWrapper, animatedStyle]}>
      <Pressable
        style={[styles.albumCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{color: `${item.accentColor}22`}}>

        {/* Color accent strip */}
        <View style={[styles.accentStrip, {backgroundColor: item.accentColor}]} />

        <View style={styles.albumCardBody}>
          {/* Cover area */}
          <View style={[styles.cover, {backgroundColor: `${item.accentColor}18`}]}>
            <MaterialCommunityIcons
              name={item.computedCoverUri ? 'image-multiple-outline' : 'folder-image'}
              size={32}
              color={item.accentColor}
            />
            {item.computedCount > 0 && (
              <View style={[styles.countBadge, {backgroundColor: item.accentColor}]}>
                <Text style={styles.countBadgeText}>{item.computedCount}</Text>
              </View>
            )}
          </View>

          <Text numberOfLines={1} style={[styles.albumName, {color: theme.colors.text}]}>
            {item.name}
          </Text>
          <Text style={[styles.albumCount, {color: theme.colors.muted}]}>
            {item.computedCount === 1 ? '1 screenshot' : `${item.computedCount} screenshots`}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const AlbumsScreen: React.FC<AlbumsScreenProps> = () => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((state) => state.theme);

  const {albums, createAlbum, deleteAlbum, renameAlbum} = useAlbumStore(
    useShallow((state) => ({
      albums: state.albums,
      createAlbum: state.createAlbum,
      deleteAlbum: state.deleteAlbum,
      renameAlbum: state.renameAlbum,
    })),
  );

  const screenshots = useScreenshotStore((state) => state.screenshots);

  const [createValue, setCreateValue] = useState('');
  const [activeAlbum, setActiveAlbum] = useState<AlbumWithComputedFields | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const createInputRef = useRef<TextInput>(null);

  // ── Derived data ──────────────────────────────────────────────────────────

  const computedAlbums = useMemo<AlbumWithComputedFields[]>(() => {
    const mapped = albums.map((album, index): AlbumWithComputedFields => {
      const albumShots =
        album.id === 'all-screenshots'
          ? screenshots
          : screenshots.filter((shot) => shot.albumId === album.id);

      return {
        ...album,
        computedCount: albumShots.length,
        computedCoverUri: albumShots[0]?.uri ?? null,
        accentColor: ALBUM_COLORS[index % ALBUM_COLORS.length],
      };
    });

    switch (sortMode) {
      case 'name':
        return [...mapped].sort((a, b) => a.name.localeCompare(b.name));
      case 'count':
        return [...mapped].sort((a, b) => b.computedCount - a.computedCount);
      case 'date':
      default:
        return mapped;
    }
  }, [albums, screenshots, sortMode]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCreateAlbum = useCallback((): void => {
    const trimmed = createValue.trim();
    if (!trimmed) return;
    createAlbum(trimmed);
    setCreateValue('');
    createInputRef.current?.blur();
  }, [createAlbum, createValue]);

  const handleOpenOptions = useCallback((item: AlbumWithComputedFields): void => {
    setActiveAlbum(item);
    setRenameValue(item.name);
  }, []);

  const handleNavigate = useCallback(
    (item: AlbumWithComputedFields): void => {
      if (item.id === 'all-screenshots') {
        rootNavigation.navigate('Main');
        return;
      }
      rootNavigation.navigate('AlbumDetail', {albumId: item.id, albumName: item.name});
    },
    [rootNavigation],
  );

  const closeModal = useCallback((): void => {
    setActiveAlbum(null);
    setRenameValue('');
  }, []);

  const saveRename = useCallback((): void => {
    if (!activeAlbum || !renameValue.trim()) return;
    renameAlbum(activeAlbum.id, renameValue.trim());
    closeModal();
  }, [activeAlbum, closeModal, renameAlbum, renameValue]);

  const confirmDelete = useCallback((): void => {
    if (!activeAlbum) return;
    Alert.alert(
      'Delete album',
      `Delete "${activeAlbum.name}"? Screenshots inside won't be deleted.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAlbum(activeAlbum.id);
            closeModal();
          },
        },
      ],
    );
  }, [activeAlbum, closeModal, deleteAlbum]);

  const cycleSortMode = useCallback((): void => {
    setSortMode((prev) => {
      if (prev === 'date') return 'name';
      if (prev === 'name') return 'count';
      return 'date';
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  const renderAlbum: ListRenderItem<AlbumWithComputedFields> = useCallback(
    ({item}) => (
      <AlbumCard
        item={item}
        theme={theme}
        onPress={() => handleNavigate(item)}
        onLongPress={() => handleOpenOptions(item)}
      />
    ),
    [handleNavigate, handleOpenOptions, theme],
  );

  const sortLabel: Record<SortMode, string> = {date: 'Recent', name: 'A–Z', count: 'Count'};

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>

      {/* Create album bar */}
      <View style={[styles.createWrap, {borderColor: theme.colors.border, backgroundColor: theme.colors.surface}]}>
        <MaterialCommunityIcons name="folder-plus-outline" size={18} color={theme.colors.muted} />
        <TextInput
          ref={createInputRef}
          value={createValue}
          onChangeText={setCreateValue}
          placeholder="New album name"
          placeholderTextColor={theme.colors.muted}
          style={[styles.createInput, {color: theme.colors.text}]}
          onSubmitEditing={handleCreateAlbum}
          returnKeyType="done"
        />
        <Pressable
          style={[
            styles.createButton,
            {backgroundColor: createValue.trim() ? theme.colors.primary : theme.colors.border},
          ]}
          onPress={handleCreateAlbum}
          disabled={!createValue.trim()}>
          <Text style={styles.createButtonLabel}>Create</Text>
        </Pressable>
      </View>

      {/* Sort header */}
      <View style={styles.sortBar}>
        <Text style={[styles.sortLabel, {color: theme.colors.muted}]}>
          {computedAlbums.length} albums
        </Text>
        <Pressable style={styles.sortButton} onPress={cycleSortMode}>
          <MaterialCommunityIcons name="sort" size={15} color={theme.colors.primary} />
          <Text style={[styles.sortButtonText, {color: theme.colors.primary}]}>
            {sortLabel[sortMode]}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={computedAlbums}
        keyExtractor={(item) => item.id}
        renderItem={renderAlbum}
        getItemLayout={(_, index) => ({
          index,
          length: ALBUM_ROW_HEIGHT,
          offset: ALBUM_ROW_HEIGHT * Math.floor(index / 2),
        })}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={styles.listContent}
        windowSize={9}
        removeClippedSubviews
      />

      {/* Album options bottom sheet */}
      <Modal
        visible={activeAlbum !== null}
        transparent
        animationType="slide"
        onRequestClose={closeModal}>
        <Pressable style={styles.modalBackdrop} onPress={closeModal}>
          <Pressable
            style={[styles.modalCard, {backgroundColor: theme.colors.surface}]}
            onPress={() => {/* stop propagation */}}>

            {/* Handle */}
            <View style={[styles.modalHandle, {backgroundColor: theme.colors.border}]} />

            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
              {activeAlbum?.name}
            </Text>

            {/* NEW: Show screenshot count in modal */}
            <Text style={[styles.modalSubtitle, {color: theme.colors.muted}]}>
              {activeAlbum?.computedCount ?? 0} screenshots
            </Text>

            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={[
                styles.renameInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.background,
                },
              ]}
              placeholder="Rename album"
              placeholderTextColor={theme.colors.muted}
              onSubmitEditing={saveRename}
              returnKeyType="done"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, {backgroundColor: theme.colors.background, borderColor: theme.colors.border}]}
                onPress={saveRename}>
                <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.primary} />
                <Text style={[styles.modalButtonLabel, {color: theme.colors.primary}]}>Rename</Text>
              </Pressable>

              {/* NEW: Navigate to album directly from modal */}
              <Pressable
                style={[styles.modalButton, {backgroundColor: theme.colors.background, borderColor: theme.colors.border}]}
                onPress={() => {
                  closeModal();
                  if (activeAlbum) handleNavigate(activeAlbum);
                }}>
                <MaterialCommunityIcons name="open-in-app" size={16} color={theme.colors.text} />
                <Text style={[styles.modalButtonLabel, {color: theme.colors.text}]}>Open</Text>
              </Pressable>

              {activeAlbum?.id !== 'all-screenshots' && (
                <Pressable
                  style={[styles.modalButton, {backgroundColor: '#fef2f2', borderColor: '#fecaca'}]}
                  onPress={confirmDelete}>
                  <MaterialCommunityIcons name="delete-outline" size={16} color={theme.colors.danger} />
                  <Text style={[styles.modalButtonLabel, {color: theme.colors.danger}]}>Delete</Text>
                </Pressable>
              )}
            </View>

            <Pressable style={styles.cancelAction} onPress={closeModal}>
              <Text style={[styles.cancelText, {color: theme.colors.muted}]}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  createWrap: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createInput: {flex: 1, fontSize: 14, paddingHorizontal: 4},
  createButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonLabel: {color: '#ffffff', fontSize: 13, fontWeight: '700'},
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sortLabel: {fontSize: 12, fontWeight: '500'},
  sortButton: {flexDirection: 'row', alignItems: 'center', gap: 4},
  sortButtonText: {fontSize: 12, fontWeight: '700'},
  listContent: {paddingHorizontal: 12, paddingBottom: 24, gap: 12},
  columnWrap: {gap: 12},
  albumCardWrapper: {flex: 1},
  albumCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentStrip: {height: 4, width: '100%'},
  albumCardBody: {padding: 10, gap: 6},
  cover: {
    borderRadius: 10,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: 'center',
  },
  countBadgeText: {color: '#fff', fontSize: 10, fontWeight: '800'},
  albumName: {fontSize: 14, fontWeight: '700'},
  albumCount: {fontSize: 12, fontWeight: '500'},
  modalBackdrop: {flex: 1, backgroundColor: '#00000075', justifyContent: 'flex-end'},
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 10,
  },
  modalHandle: {alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 6},
  modalTitle: {fontSize: 18, fontWeight: '700'},
  modalSubtitle: {fontSize: 13, fontWeight: '400', marginTop: -4},
  renameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
  },
  modalActions: {flexDirection: 'row', gap: 8},
  modalButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    flexDirection: 'row',
    gap: 5,
  },
  modalButtonLabel: {fontSize: 13, fontWeight: '700'},
  cancelAction: {alignItems: 'center', paddingVertical: 6},
  cancelText: {fontSize: 13, fontWeight: '600'},
});