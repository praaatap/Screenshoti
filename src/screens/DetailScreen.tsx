import React, {useMemo, useState} from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageView from 'react-native-image-viewing';
import Share from 'react-native-share';
import {useAlbumStore} from '../store/useAlbumStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import type {DetailScreenProps} from '../types';
import {formatBytes, formatDateTime} from '../utils/formatters';

export const DetailScreen: React.FC<DetailScreenProps> = ({navigation, route}) => {
  const theme = useThemeStore((state) => state.theme);
  const screenshots = useScreenshotStore((state) => state.screenshots);
  const toggleFavorite = useScreenshotStore((state) => state.toggleFavorite);
  const deleteScreenshot = useScreenshotStore((state) => state.deleteScreenshot);
  const addTag = useScreenshotStore((state) => state.addTag);
  const removeTag = useScreenshotStore((state) => state.removeTag);
  const moveToAlbum = useScreenshotStore((state) => state.moveToAlbum);

  const albums = useAlbumStore((state) => state.albums);

  const [isViewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [newTag, setNewTag] = useState('');

  const currentIndex = useMemo(
    () => screenshots.findIndex((shot) => shot.id === route.params.screenshotId),
    [route.params.screenshotId, screenshots],
  );

  const currentScreenshot = currentIndex >= 0 ? screenshots[currentIndex] : undefined;

  const imageSources = useMemo(() => screenshots.map((shot) => ({uri: shot.uri})), [screenshots]);

  if (!currentScreenshot) {
    return (
      <View style={[styles.centered, {backgroundColor: theme.colors.background}]}> 
        <Text style={[styles.notFoundTitle, {color: theme.colors.text}]}>Screenshot not found</Text>
        <Pressable style={[styles.backButton, {backgroundColor: theme.colors.primary}]} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonLabel}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const currentAlbum = albums.find((album) => album.id === currentScreenshot.albumId);

  const openViewer = (): void => {
    setActiveIndex(Math.max(currentIndex, 0));
    setViewerVisible(true);
  };

  const shareCurrent = async (): Promise<void> => {
    try {
      await Share.open({url: currentScreenshot.uri});
    } catch {
      // Share modal dismiss is expected.
    }
  };

  const deleteCurrent = (): void => {
    Alert.alert('Delete screenshot', 'This removes the screenshot from the in-app manager list.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteScreenshot(currentScreenshot.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const addTagToCurrent = (): void => {
    addTag(currentScreenshot.id, newTag);
    setNewTag('');
  };

  const moveToFirstAlbum = (): void => {
    const firstAlbum = albums.find((album) => album.id !== 'all-screenshots');

    if (!firstAlbum) {
      Alert.alert('No album', 'Create an album first from the Albums tab.');
      return;
    }

    moveToAlbum([currentScreenshot.id], firstAlbum.id);
  };

  const goToPrevious = (): void => {
    if (currentIndex <= 0) {
      return;
    }

    const previous = screenshots[currentIndex - 1];
    navigation.replace('Detail', {screenshotId: previous.id});
  };

  const goToNext = (): void => {
    if (currentIndex >= screenshots.length - 1) {
      return;
    }

    const next = screenshots[currentIndex + 1];
    navigation.replace('Detail', {screenshotId: next.id});
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}> 
      <ScrollView contentContainerStyle={styles.content}> 
        <Pressable style={styles.previewWrap} onPress={openViewer}>
          <View style={[styles.previewCard, {backgroundColor: theme.colors.surface}]}> 
            <MaterialCommunityIcons name="gesture-pinch" size={30} color={theme.colors.muted} />
            <Text style={[styles.previewText, {color: theme.colors.text}]}>Tap to view full-screen</Text>
          </View>
        </Pressable>

        <View style={[styles.metadataCard, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
          <Text style={[styles.fileName, {color: theme.colors.text}]}>{currentScreenshot.fileName}</Text>

          <Text style={[styles.metaLine, {color: theme.colors.muted}]}>Size: {formatBytes(currentScreenshot.fileSize)}</Text>
          <Text style={[styles.metaLine, {color: theme.colors.muted}]}>Date: {formatDateTime(currentScreenshot.createdAt)}</Text>
          <Text style={[styles.metaLine, {color: theme.colors.muted}]}>Album: {currentAlbum?.name ?? 'Unsorted'}</Text>

          <View style={styles.tagWrap}>
            {currentScreenshot.tags.length === 0 ? (
              <Text style={[styles.noTags, {color: theme.colors.muted}]}>No tags</Text>
            ) : (
              currentScreenshot.tags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => removeTag(currentScreenshot.id, tag)}
                  style={[styles.tagChip, {borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}> 
                  <Text style={[styles.tagText, {color: theme.colors.text}]}>#{tag}</Text>
                </Pressable>
              ))
            )}
          </View>

          <View style={styles.addTagRow}>
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag"
              placeholderTextColor={theme.colors.muted}
              style={[styles.tagInput, {color: theme.colors.text, borderColor: theme.colors.border}]}
            />
            <Pressable style={[styles.tagAddButton, {backgroundColor: theme.colors.primary}]} onPress={addTagToCurrent}>
              <Text style={styles.tagAddButtonLabel}>Add</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <Pressable style={[styles.actionButton, {backgroundColor: theme.colors.surface}]} onPress={() => {
            void shareCurrent();
          }}>
            <MaterialCommunityIcons name="share-variant" size={22} color={theme.colors.text} />
            <Text style={[styles.actionLabel, {color: theme.colors.text}]}>Share</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, {backgroundColor: theme.colors.surface}]} onPress={deleteCurrent}>
            <MaterialCommunityIcons name="delete-outline" size={22} color={theme.colors.danger} />
            <Text style={[styles.actionLabel, {color: theme.colors.danger}]}>Delete</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, {backgroundColor: theme.colors.surface}]}
            onPress={() => toggleFavorite(currentScreenshot.id)}>
            <MaterialCommunityIcons
              name={currentScreenshot.isFavorite ? 'heart-off-outline' : 'heart-outline'}
              size={22}
              color={theme.colors.text}
            />
            <Text style={[styles.actionLabel, {color: theme.colors.text}]}>Favorite</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, {backgroundColor: theme.colors.surface}]} onPress={moveToFirstAlbum}>
            <MaterialCommunityIcons name="folder-move" size={22} color={theme.colors.text} />
            <Text style={[styles.actionLabel, {color: theme.colors.text}]}>Move</Text>
          </Pressable>
        </View>

        <View style={styles.navButtons}>
          <Pressable
            style={[styles.navButton, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
            onPress={goToPrevious}
            disabled={currentIndex <= 0}>
            <Text style={[styles.navButtonText, {color: theme.colors.text}]}>Previous</Text>
          </Pressable>

          <Pressable
            style={[styles.navButton, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}
            onPress={goToNext}
            disabled={currentIndex >= screenshots.length - 1}>
            <Text style={[styles.navButtonText, {color: theme.colors.text}]}>Next</Text>
          </Pressable>
        </View>
      </ScrollView>

      <ImageView
        images={imageSources}
        imageIndex={activeIndex}
        visible={isViewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled
        onImageIndexChange={(index) => {
          const nextIndex = index ?? 0;
          setActiveIndex(nextIndex);

          const shot = screenshots[nextIndex];
          if (shot && shot.id !== route.params.screenshotId) {
            navigation.replace('Detail', {screenshotId: shot.id});
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  previewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  previewCard: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
  },
  metadataCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '700',
  },
  metaLine: {
    fontSize: 13,
    fontWeight: '500',
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
  },
  noTags: {
    fontSize: 12,
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addTagRow: {
    marginTop: 6,
    flexDirection: 'row',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
  },
  tagAddButton: {
    borderRadius: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagAddButtonLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    width: '48%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
