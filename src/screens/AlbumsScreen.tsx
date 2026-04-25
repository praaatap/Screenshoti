import React, {useCallback, useMemo, useRef, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {
  FlatList,
  Image,
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
import {useToastStore} from '../store/useToastStore';
import {BottomSheet} from '../components/ui/BottomSheet';
import {ConfirmationSheet} from '../components/ui/ConfirmationSheet';
import {designTokens} from '../theme/tokens';
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
        style={[styles.albumCard, designTokens.elevation.low, {backgroundColor: theme.colors.surface}]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{color: `${item.accentColor}22`}}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} album, ${item.computedCount} screenshots`}
        accessibilityHint="Tap to open, long press for options">

        <View style={styles.albumCardBody}>
          {/* Cover area - show actual thumbnail */}
          <View style={[styles.cover, {backgroundColor: `${item.accentColor}12`}]}>
            {item.computedCoverUri ? (
              <Image
                source={{uri: item.computedCoverUri}}
                style={styles.coverImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.coverPlaceholder}>
                <MaterialCommunityIcons
                  name="folder-image"
                  size={designTokens.iconSize.xl}
                  color={item.accentColor}
                />
              </View>
            )}
            {item.computedCount > 0 && (
              <View style={[styles.countBadge, {backgroundColor: item.accentColor}]}>
                <Text style={styles.countBadgeText}>{item.computedCount}</Text>
              </View>
            )}
          </View>

          {/* Text overlay area */}
          <View style={styles.albumTextArea}>
            <Text numberOfLines={1} style={[designTokens.typography.titleMedium, {color: theme.colors.text}]}>
              {item.name}
            </Text>
            <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>
              {item.computedCount === 1 ? '1 screenshot' : `${item.computedCount} screenshots`}
            </Text>
          </View>
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
  const showToast = useToastStore((state) => state.show);

  const [createValue, setCreateValue] = useState('');
  const [activeAlbum, setActiveAlbum] = useState<AlbumWithComputedFields | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('date');
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
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
    setShowDeleteSheet(true);
  }, [activeAlbum]);

  const executeDelete = useCallback((): void => {
    if (!activeAlbum) return;
    deleteAlbum(activeAlbum.id);
    showToast(`Album "${activeAlbum.name}" deleted.`, 'success');
    closeModal();
  }, [activeAlbum, closeModal, deleteAlbum, showToast]);

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
      <BottomSheet visible={activeAlbum !== null} onClose={closeModal} theme={theme}>
        <Text style={[styles.modalTitle, {color: theme.colors.text}]}>
          {activeAlbum?.name}
        </Text>

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

          <Pressable
            style={[styles.modalButton, {backgroundColor: theme.colors.background, borderColor: theme.colors.border}]}
            onPress={() => {
              closeModal();
              if (activeAlbum) {handleNavigate(activeAlbum);}
            }}>
            <MaterialCommunityIcons name="open-in-app" size={16} color={theme.colors.text} />
            <Text style={[styles.modalButtonLabel, {color: theme.colors.text}]}>Open</Text>
          </Pressable>

          {activeAlbum?.id !== 'all-screenshots' && (
            <Pressable
              style={[styles.modalButton, {backgroundColor: theme.colors.dangerContainer, borderColor: theme.colors.danger}]}
              onPress={confirmDelete}>
              <MaterialCommunityIcons name="delete-outline" size={16} color={theme.colors.danger} />
              <Text style={[styles.modalButtonLabel, {color: theme.colors.danger}]}>Delete</Text>
            </Pressable>
          )}
        </View>
      </BottomSheet>

      <ConfirmationSheet
        visible={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)}
        onConfirm={executeDelete}
        theme={theme}
        title="Delete album"
        description={`Delete "${activeAlbum?.name}"? Screenshots inside won't be deleted.`}
        confirmLabel="Delete"
        icon="folder-remove-outline"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  createWrap: {
    marginHorizontal: designTokens.spacing.lg,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.xs,
    borderRadius: designTokens.radius.lg,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    ...designTokens.elevation.low,
  },
  createInput: {flex: 1, ...designTokens.typography.bodyMedium, paddingHorizontal: designTokens.spacing.xs},
  createButton: {
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonLabel: {color: '#ffffff', ...designTokens.typography.labelLarge},
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
  },
  sortLabel: designTokens.typography.bodySmall,
  sortButton: {flexDirection: 'row', alignItems: 'center', gap: designTokens.spacing.xs},
  sortButtonText: designTokens.typography.labelMedium,
  listContent: {paddingHorizontal: designTokens.spacing.lg, paddingBottom: designTokens.spacing.xxxl, gap: designTokens.spacing.md},
  columnWrap: {gap: designTokens.spacing.md},
  albumCardWrapper: {flex: 1},
  albumCard: {
    flex: 1,
    borderRadius: designTokens.radius.lg,
    overflow: 'hidden',
  },
  albumCardBody: {gap: 0},
  cover: {
    borderRadius: 0,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  countBadge: {
    position: 'absolute',
    top: designTokens.spacing.sm,
    right: designTokens.spacing.sm,
    borderRadius: designTokens.radius.full,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xxs,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {color: '#fff', ...designTokens.typography.labelSmall},
  albumTextArea: {
    padding: designTokens.spacing.md,
    gap: designTokens.spacing.xxs,
  },
  modalTitle: {...designTokens.typography.headlineMedium},
  modalSubtitle: {...designTokens.typography.bodySmall, marginTop: -designTokens.spacing.xs},
  renameInput: {
    borderWidth: 1,
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.md,
    height: 44,
    ...designTokens.typography.bodyMedium,
  },
  modalActions: {flexDirection: 'row', gap: designTokens.spacing.sm, marginTop: designTokens.spacing.sm},
  modalButton: {
    flex: 1,
    borderRadius: designTokens.radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    flexDirection: 'row',
    gap: designTokens.spacing.xs,
  },
  modalButtonLabel: designTokens.typography.labelLarge,
});