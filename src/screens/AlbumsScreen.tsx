import React, {useMemo, useState} from 'react';
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAlbumStore} from '../store/useAlbumStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import type {Album, AlbumsScreenProps, RootStackParamList} from '../types';

const ALBUM_ROW_HEIGHT = 192;

interface AlbumWithComputedFields extends Album {
  computedCount: number;
  computedCoverUri: string | null;
}

export const AlbumsScreen: React.FC<AlbumsScreenProps> = () => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((state) => state.theme);
  const albums = useAlbumStore((state) => state.albums);
  const createAlbum = useAlbumStore((state) => state.createAlbum);
  const deleteAlbum = useAlbumStore((state) => state.deleteAlbum);
  const renameAlbum = useAlbumStore((state) => state.renameAlbum);
  const screenshots = useScreenshotStore((state) => state.screenshots);

  const [createValue, setCreateValue] = useState('');
  const [activeAlbum, setActiveAlbum] = useState<AlbumWithComputedFields | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const computedAlbums = useMemo<AlbumWithComputedFields[]>(() => {
    return albums.map((album) => {
      if (album.id === 'all-screenshots') {
        return {
          ...album,
          computedCount: screenshots.length,
          computedCoverUri: screenshots[0]?.uri ?? null,
        };
      }

      const albumShots = screenshots.filter((shot) => shot.albumId === album.id);

      return {
        ...album,
        computedCount: albumShots.length,
        computedCoverUri: albumShots[0]?.uri ?? null,
      };
    });
  }, [albums, screenshots]);

  const handleCreateAlbum = (): void => {
    if (!createValue.trim()) {
      return;
    }

    createAlbum(createValue);
    setCreateValue('');
  };

  const renderAlbum: ListRenderItem<AlbumWithComputedFields> = ({item}) => (
    <Pressable
      style={[styles.albumCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
      onPress={() => {
        if (item.id === 'all-screenshots') {
          rootNavigation.navigate('Main');
          return;
        }

        rootNavigation.navigate('AlbumDetail', {albumId: item.id, albumName: item.name});
      }}
      onLongPress={() => {
        setActiveAlbum(item);
        setRenameValue(item.name);
      }}>
      <View style={[styles.cover, {backgroundColor: theme.colors.background}]}> 
        {item.computedCoverUri ? (
          <View style={styles.coverBadge}>
            <MaterialCommunityIcons name="image-multiple" size={24} color={theme.colors.primary} />
          </View>
        ) : (
          <MaterialCommunityIcons name="folder-image" size={36} color={theme.colors.muted} />
        )}
      </View>

      <Text numberOfLines={1} style={[styles.albumName, {color: theme.colors.text}]}> 
        {item.name}
      </Text>
      <Text style={[styles.albumCount, {color: theme.colors.muted}]}>{item.computedCount} screenshots</Text>
    </Pressable>
  );

  const closeModal = (): void => {
    setActiveAlbum(null);
    setRenameValue('');
  };

  const saveRename = (): void => {
    if (!activeAlbum) {
      return;
    }

    renameAlbum(activeAlbum.id, renameValue);
    closeModal();
  };

  const confirmDelete = (): void => {
    if (!activeAlbum) {
      return;
    }

    Alert.alert('Delete album', `Delete ${activeAlbum.name}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteAlbum(activeAlbum.id);
          closeModal();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}> 
      <View style={[styles.createWrap, {borderColor: theme.colors.border, backgroundColor: theme.colors.surface}]}> 
        <TextInput
          value={createValue}
          onChangeText={setCreateValue}
          placeholder="Create new album"
          placeholderTextColor={theme.colors.muted}
          style={[styles.createInput, {color: theme.colors.text}]}
        />
        <Pressable style={[styles.createButton, {backgroundColor: theme.colors.primary}]} onPress={handleCreateAlbum}>
          <Text style={styles.createButtonLabel}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={computedAlbums}
        keyExtractor={(item) => item.id}
        renderItem={renderAlbum}
        getItemLayout={(_, index) => {
          const row = Math.floor(index / 2);

          return {
            index,
            length: ALBUM_ROW_HEIGHT,
            offset: ALBUM_ROW_HEIGHT * row,
          };
        }}
        numColumns={2}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={styles.listContent}
        windowSize={9}
      />

      <Modal visible={activeAlbum !== null} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, {backgroundColor: theme.colors.surface}]}> 
            <Text style={[styles.modalTitle, {color: theme.colors.text}]}>Album options</Text>
            <TextInput
              value={renameValue}
              onChangeText={setRenameValue}
              style={[
                styles.renameInput,
                {color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background},
              ]}
              placeholder="Rename album"
              placeholderTextColor={theme.colors.muted}
            />

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, {backgroundColor: theme.colors.background}]} onPress={saveRename}>
                <Text style={[styles.modalButtonLabel, {color: theme.colors.text}]}>Rename</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, {backgroundColor: '#fbe4e4'}]} onPress={confirmDelete}>
                <Text style={[styles.modalButtonLabel, {color: theme.colors.danger}]}>Delete</Text>
              </Pressable>
            </View>

            <Pressable style={styles.cancelAction} onPress={closeModal}>
              <Text style={[styles.cancelText, {color: theme.colors.muted}]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  createWrap: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    gap: 8,
  },
  createInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
  },
  createButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 12,
  },
  columnWrap: {
    gap: 12,
  },
  albumCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  cover: {
    borderRadius: 10,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    height: 50,
    width: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffffb0',
  },
  albumName: {
    fontSize: 14,
    fontWeight: '700',
  },
  albumCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000070',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  renameInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 42,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  modalButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  cancelAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
