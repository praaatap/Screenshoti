import React, {useCallback, useMemo, useState} from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageView from 'react-native-image-viewing';
import Share from 'react-native-share';
import {useShallow} from 'zustand/react/shallow';
import {trackEvent} from '../services/observability/analytics';
import {useAlbumStore} from '../store/useAlbumStore';
import {useIntelligenceStore} from '../store/useIntelligenceStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import type {DetailScreenProps} from '../types';
import {formatBytes, formatDateTime} from '../utils/formatters';

// ─── Action Button Sub-component ─────────────────────────────────────────────

interface ActionButtonProps {
  icon: string;
  label: string;
  color: string;
  backgroundColor: string;
  onPress: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({icon, label, color, backgroundColor, onPress}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  return (
    <Animated.View style={[{flex: 1}, animStyle]}>
      <Pressable
        style={[styles.actionButton, {backgroundColor}]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.93); }}
        onPressOut={() => { scale.value = withSpring(1); }}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
        <Text style={[styles.actionLabel, {color}]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const DetailScreen: React.FC<DetailScreenProps> = ({navigation, route}) => {
  const theme = useThemeStore((state) => state.theme);

  const {
    screenshots,
    toggleFavorite,
    deleteScreenshot,
    addTag,
    removeTag,
    moveToAlbum,
    updateNote,   // NEW — add this action to your store
  } = useScreenshotStore(
    useShallow((state) => ({
      screenshots: state.screenshots,
      toggleFavorite: state.toggleFavorite,
      deleteScreenshot: state.deleteScreenshot,
      addTag: state.addTag,
      removeTag: state.removeTag,
      moveToAlbum: state.moveToAlbum,
      updateNote: state.updateNote,
    })),
  );

  const albums = useAlbumStore((state) => state.albums);
  const ocrById = useIntelligenceStore((state) => state.ocrById);
  const insightById = useIntelligenceStore((state) => state.insightById);

  const [isViewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [newTag, setNewTag] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState('');

  // ── Derived ───────────────────────────────────────────────────────────────

  const currentIndex = useMemo(
    () => screenshots.findIndex((shot) => shot.id === route.params.screenshotId),
    [route.params.screenshotId, screenshots],
  );

  const currentScreenshot = currentIndex >= 0 ? screenshots[currentIndex] : undefined;
  const imageSources = useMemo(() => screenshots.map((shot) => ({uri: shot.uri})), [screenshots]);
  const extractedText = currentScreenshot ? ocrById[currentScreenshot.id] ?? '' : '';
  const similarIds = currentScreenshot ? insightById[currentScreenshot.id]?.similarIds ?? [] : [];

  // ── Not found ─────────────────────────────────────────────────────────────

  if (!currentScreenshot) {
    return (
      <View style={[styles.centered, {backgroundColor: theme.colors.background}]}>
        <MaterialCommunityIcons name="image-broken-variant" size={52} color={theme.colors.muted} />
        <Text style={[styles.notFoundTitle, {color: theme.colors.text}]}>Screenshot not found</Text>
        <Pressable
          style={[styles.backButton, {backgroundColor: theme.colors.primary}]}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonLabel}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const currentAlbum = albums.find((a) => a.id === currentScreenshot.albumId);

  const openViewer = useCallback((): void => {
    setActiveIndex(Math.max(currentIndex, 0));
    setViewerVisible(true);
  }, [currentIndex]);

  const shareCurrent = useCallback(async (): Promise<void> => {
    try {
      await Share.open({url: currentScreenshot.uri});
      trackEvent('detail_share_image', {id: currentScreenshot.id});
    } catch { /* dismissed */ }
  }, [currentScreenshot.id, currentScreenshot.uri]);

  const shareAsPdfSummary = useCallback(async (): Promise<void> => {
    const text = [
      `Screenshot: ${currentScreenshot.fileName}`,
      `Date: ${formatDateTime(currentScreenshot.createdAt)}`,
      `Size: ${formatBytes(currentScreenshot.fileSize)}`,
      '',
      'Extracted text:',
      extractedText || 'No extracted text available',
    ].join('\n');

    try {
      await Share.open({
        title: 'Screenshot Summary',
        message: text,
      });
      trackEvent('detail_export_summary', {id: currentScreenshot.id});
    } catch {
      // Share dismissed.
    }
  }, [currentScreenshot.createdAt, currentScreenshot.fileName, currentScreenshot.fileSize, currentScreenshot.id, extractedText]);

  const copyExtractedText = useCallback((): void => {
    if (!extractedText) {
      Alert.alert('No text found', 'No extracted text is available for this screenshot yet.');
      return;
    }

    Alert.alert('Extracted text', extractedText);
    trackEvent('detail_view_extracted_text', {id: currentScreenshot.id});
  }, [currentScreenshot.id, extractedText]);

  const deleteCurrent = useCallback((): void => {
    Alert.alert(
      'Remove screenshot',
      'This removes it from the manager list. The original file stays in your gallery.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteScreenshot(currentScreenshot.id);
            navigation.goBack();
          },
        },
      ],
    );
  }, [currentScreenshot.id, deleteScreenshot, navigation]);

  const addTagToCurrent = useCallback((): void => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    addTag(currentScreenshot.id, trimmed);
    setNewTag('');
  }, [addTag, currentScreenshot.id, newTag]);

  // NEW: Album picker using Alert
  const handleMoveToAlbum = useCallback((): void => {
    const targets = albums.filter((a) => a.id !== 'all-screenshots');
    if (targets.length === 0) {
      Alert.alert('No albums', 'Create an album from the Albums tab first.');
      return;
    }
    Alert.alert(
      'Move to album',
      'Choose a destination:',
      [
        ...targets.map((a) => ({
          text: a.name,
          onPress: () => moveToAlbum([currentScreenshot.id], a.id),
        })),
        {text: 'Cancel', style: 'cancel' as const},
      ],
    );
  }, [albums, currentScreenshot.id, moveToAlbum]);

  // NEW: Save note
  const saveNote = useCallback((): void => {
    updateNote(currentScreenshot.id, noteValue.trim());
    setIsEditingNote(false);
  }, [currentScreenshot.id, noteValue, updateNote]);

  const goToPrevious = useCallback((): void => {
    if (currentIndex <= 0) return;
    navigation.replace('Detail', {screenshotId: screenshots[currentIndex - 1].id});
  }, [currentIndex, navigation, screenshots]);

  const goToNext = useCallback((): void => {
    if (currentIndex >= screenshots.length - 1) return;
    navigation.replace('Detail', {screenshotId: screenshots[currentIndex + 1].id});
  }, [currentIndex, navigation, screenshots]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Real image preview (replaces placeholder) ── */}
        <Pressable style={styles.previewWrap} onPress={openViewer}>
          <Image
            source={{uri: currentScreenshot.uri}}
            style={styles.previewImage}
            resizeMode="contain"
          />
          {/* Overlay tap hint */}
          <View style={styles.previewOverlay}>
            <MaterialCommunityIcons name="loupe" size={18} color="#fff" />
            <Text style={styles.previewOverlayText}>Tap to expand</Text>
          </View>
        </Pressable>

        {/* ── Navigation row ── */}
        <View style={styles.navButtons}>
          <Pressable
            style={[
              styles.navButton,
              {backgroundColor: theme.colors.surface, borderColor: theme.colors.border},
              currentIndex <= 0 && styles.navButtonDisabled,
            ]}
            onPress={goToPrevious}
            disabled={currentIndex <= 0}>
            <MaterialCommunityIcons
              name="chevron-left"
              size={20}
              color={currentIndex <= 0 ? theme.colors.muted : theme.colors.text}
            />
            <Text style={[styles.navButtonText, {color: currentIndex <= 0 ? theme.colors.muted : theme.colors.text}]}>
              Prev
            </Text>
          </Pressable>

          <Text style={[styles.navCounter, {color: theme.colors.muted}]}>
            {currentIndex + 1} / {screenshots.length}
          </Text>

          <Pressable
            style={[
              styles.navButton,
              {backgroundColor: theme.colors.surface, borderColor: theme.colors.border},
              currentIndex >= screenshots.length - 1 && styles.navButtonDisabled,
            ]}
            onPress={goToNext}
            disabled={currentIndex >= screenshots.length - 1}>
            <Text style={[styles.navButtonText, {color: currentIndex >= screenshots.length - 1 ? theme.colors.muted : theme.colors.text}]}>
              Next
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={currentIndex >= screenshots.length - 1 ? theme.colors.muted : theme.colors.text}
            />
          </Pressable>
        </View>

        {/* ── Metadata card ── */}
        <View style={[styles.card, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <View style={styles.fileNameRow}>
            <Text numberOfLines={2} style={[styles.fileName, {color: theme.colors.text}]}>
              {currentScreenshot.fileName}
            </Text>
            {/* NEW: Favorite indicator inline */}
            {currentScreenshot.isFavorite && (
              <MaterialCommunityIcons name="heart" size={16} color="#f43f5e" />
            )}
          </View>

          <View style={styles.metaGrid}>
            <MetaRow icon="harddisk" label="Size" value={formatBytes(currentScreenshot.fileSize)} theme={theme} />
            <MetaRow icon="calendar" label="Date" value={formatDateTime(currentScreenshot.createdAt)} theme={theme} />
            <MetaRow icon="folder" label="Album" value={currentAlbum?.name ?? 'Unsorted'} theme={theme} />
          </View>
        </View>

        {/* ── Tags card ── */}
        <View style={[styles.card, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <Text style={[styles.cardTitle, {color: theme.colors.text}]}>Tags</Text>
          <View style={styles.tagWrap}>
            {currentScreenshot.tags.length === 0 ? (
              <Text style={[styles.emptyHint, {color: theme.colors.muted}]}>No tags yet — add one below</Text>
            ) : (
              currentScreenshot.tags.map((tag: string) => (
                <Pressable
                  key={tag}
                  onPress={() => removeTag(currentScreenshot.id, tag)}
                  style={[styles.tagChip, {borderColor: theme.colors.primary, backgroundColor: `${theme.colors.primary}18`}]}>
                  <Text style={[styles.tagText, {color: theme.colors.primary}]}>#{tag}</Text>
                  <MaterialCommunityIcons name="close" size={12} color={theme.colors.primary} />
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
              style={[styles.tagInput, {color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}
              onSubmitEditing={addTagToCurrent}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.tagAddButton, {backgroundColor: newTag.trim() ? theme.colors.primary : theme.colors.border}]}
              onPress={addTagToCurrent}
              disabled={!newTag.trim()}>
              <Text style={styles.tagAddButtonLabel}>Add</Text>
            </Pressable>
          </View>
        </View>

        {/* ── NEW: Note card ── */}
        <View style={[styles.card, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, {color: theme.colors.text}]}>Note</Text>
            <Pressable onPress={() => {
              setNoteValue(currentScreenshot.note ?? '');
              setIsEditingNote((prev) => !prev);
            }}>
              <Text style={[styles.editLink, {color: theme.colors.primary}]}>
                {isEditingNote ? 'Cancel' : 'Edit'}
              </Text>
            </Pressable>
          </View>
          {isEditingNote ? (
            <>
              <TextInput
                value={noteValue}
                onChangeText={setNoteValue}
                placeholder="Write a note about this screenshot..."
                placeholderTextColor={theme.colors.muted}
                style={[styles.noteInput, {color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Pressable style={[styles.saveNoteButton, {backgroundColor: theme.colors.primary}]} onPress={saveNote}>
                <Text style={styles.saveNoteButtonLabel}>Save note</Text>
              </Pressable>
            </>
          ) : (
            <Text style={[styles.noteText, {color: currentScreenshot.note ? theme.colors.text : theme.colors.muted}]}>
              {currentScreenshot.note || 'No note added'}
            </Text>
          )}
        </View>

        <View style={[styles.card, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, {color: theme.colors.text}]}>Extracted Text</Text>
            <Pressable onPress={copyExtractedText}>
              <Text style={[styles.editLink, {color: theme.colors.primary}]}>View</Text>
            </Pressable>
          </View>
          <Text numberOfLines={3} style={[styles.noteText, {color: extractedText ? theme.colors.text : theme.colors.muted}]}> 
            {extractedText || 'OCR text index not available yet.'}
          </Text>
        </View>

        <View style={[styles.card, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border}]}> 
          <Text style={[styles.cardTitle, {color: theme.colors.text}]}>Similar</Text>
          <Text style={[styles.noteText, {color: theme.colors.muted}]}> 
            {similarIds.length > 0 ? `${similarIds.length} similar screenshots detected` : 'No similar screenshots detected'}
          </Text>
        </View>

        {/* ── Action grid ── */}
        <View style={styles.actionGrid}>
          <ActionButton
            icon="share-variant-outline"
            label="Share"
            color={theme.colors.text}
            backgroundColor={theme.colors.surface}
            onPress={() => { void shareCurrent(); }}
          />
          <ActionButton
            icon={currentScreenshot.isFavorite ? 'heart' : 'heart-outline'}
            label={currentScreenshot.isFavorite ? 'Unfave' : 'Favorite'}
            color={currentScreenshot.isFavorite ? '#f43f5e' : theme.colors.text}
            backgroundColor={theme.colors.surface}
            onPress={() => toggleFavorite(currentScreenshot.id)}
          />
          <ActionButton
            icon="folder-move-outline"
            label="Move"
            color={theme.colors.text}
            backgroundColor={theme.colors.surface}
            onPress={handleMoveToAlbum}
          />
          <ActionButton
            icon="delete-outline"
            label="Remove"
            color={theme.colors.danger}
            backgroundColor={theme.colors.surface}
            onPress={deleteCurrent}
          />
        </View>

        <View style={styles.actionGrid}>
          <ActionButton
            icon="text-box-search-outline"
            label="Extract"
            color={theme.colors.text}
            backgroundColor={theme.colors.surface}
            onPress={copyExtractedText}
          />
          <ActionButton
            icon="file-document-outline"
            label="To PDF"
            color={theme.colors.text}
            backgroundColor={theme.colors.surface}
            onPress={() => {
              void shareAsPdfSummary();
            }}
          />
        </View>
      </ScrollView>

      <ImageView
        images={imageSources}
        imageIndex={activeIndex}
        visible={isViewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled
        onImageIndexChange={(index) => {
          const next = index ?? 0;
          setActiveIndex(next);
          const shot = screenshots[next];
          if (shot && shot.id !== route.params.screenshotId) {
            navigation.replace('Detail', {screenshotId: shot.id});
          }
        }}
      />
    </KeyboardAvoidingView>
  );
};

// ─── MetaRow sub-component ────────────────────────────────────────────────────

interface MetaRowProps {
  icon: string;
  label: string;
  value: string;
  theme: ReturnType<typeof useThemeStore.getState>['theme'];
}

const MetaRow: React.FC<MetaRowProps> = ({icon, label, value, theme}) => (
  <View style={styles.metaRow}>
    <MaterialCommunityIcons name={icon} size={14} color={theme.colors.muted} />
    <Text style={[styles.metaLabel, {color: theme.colors.muted}]}>{label}</Text>
    <Text style={[styles.metaValue, {color: theme.colors.text}]} numberOfLines={1}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {paddingHorizontal: 12, paddingVertical: 12, gap: 12},
  previewWrap: {borderRadius: 16, overflow: 'hidden', position: 'relative'},
  previewImage: {width: '100%', height: 260, backgroundColor: '#00000010'},
  previewOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#00000070',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  previewOverlayText: {color: '#fff', fontSize: 11, fontWeight: '600'},
  navButtons: {flexDirection: 'row', alignItems: 'center', gap: 8},
  navButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navButtonDisabled: {opacity: 0.4},
  navButtonText: {fontSize: 13, fontWeight: '700'},
  navCounter: {fontSize: 12, fontWeight: '600'},
  card: {borderWidth: 1, borderRadius: 14, padding: 12, gap: 8},
  cardTitle: {fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5},
  cardTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  fileNameRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8},
  fileName: {fontSize: 15, fontWeight: '700', flex: 1},
  metaGrid: {gap: 5},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  metaLabel: {fontSize: 12, fontWeight: '600', width: 40},
  metaValue: {fontSize: 12, fontWeight: '400', flex: 1},
  tagWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  emptyHint: {fontSize: 12},
  tagChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tagText: {fontSize: 12, fontWeight: '600'},
  addTagRow: {flexDirection: 'row', gap: 8},
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
  tagAddButtonLabel: {color: '#ffffff', fontSize: 12, fontWeight: '700'},
  editLink: {fontSize: 13, fontWeight: '600'},
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 88,
  },
  noteText: {fontSize: 14, lineHeight: 20},
  saveNoteButton: {borderRadius: 10, height: 40, alignItems: 'center', justifyContent: 'center'},
  saveNoteButtonLabel: {color: '#fff', fontSize: 14, fontWeight: '700'},
  actionGrid: {flexDirection: 'row', gap: 8},
  actionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionLabel: {fontSize: 11, fontWeight: '700'},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12},
  notFoundTitle: {fontSize: 18, fontWeight: '700'},
  backButton: {borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10},
  backButtonLabel: {color: '#ffffff', fontSize: 13, fontWeight: '700'},
});