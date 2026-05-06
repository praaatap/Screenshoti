import React, {useMemo, useState} from 'react';
import {
  Alert,
  Dimensions,
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
import Share from 'react-native-share';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageView from 'react-native-image-viewing';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useShallow} from 'zustand/react/shallow';
import {trackEvent} from '../services/observability/analytics';
import {shareScreenshot, shareScreenshotAsText, shareDeepLink} from '../services/sharing/shareService';
import {useAlbumStore} from '../store/useAlbumStore';
import {useIntelligenceStore} from '../store/useIntelligenceStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import {useToastStore} from '../store/useToastStore';
import {ConfirmationSheet} from '../components/ui/ConfirmationSheet';
import {Chip} from '../components/ui/Chip';
import {designTokens} from '../theme/tokens';
import type {DetailScreenProps} from '../types';
import {formatBytes, formatDateTime} from '../utils/formatters';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PREVIEW_HEIGHT = Math.round(SCREEN_HEIGHT * 0.36);

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
  theme: ReturnType<typeof useThemeStore.getState>['theme'];
}

const ActionButton: React.FC<ActionButtonProps> = ({icon, label, onPress, danger = false, theme}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  return (
    <Animated.View style={[styles.actionBtn, animStyle]}>
      <Pressable
        style={[
          styles.actionBtnInner,
          {
            borderColor: danger ? theme.colors.danger : theme.colors.border,
            backgroundColor: danger ? theme.colors.dangerContainer : theme.colors.surfaceVariant,
          },
        ]}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.92); }}
        onPressOut={() => { scale.value = withSpring(1); }}>
        <MaterialCommunityIcons
          name={icon}
          size={designTokens.iconSize.sm}
          color={danger ? theme.colors.danger : theme.colors.text}
        />
      </Pressable>
      <Text style={[styles.actionBtnLabel, {color: danger ? theme.colors.danger : theme.colors.muted}]}>
        {label}
      </Text>
    </Animated.View>
  );
};

export const DetailScreen: React.FC<DetailScreenProps> = ({navigation, route}) => {
  const theme = useThemeStore((state) => state.theme);
  const insets = useSafeAreaInsets();

  const {screenshots, toggleFavorite, deleteScreenshot, addTag, removeTag, moveToAlbum, updateNote} =
    useScreenshotStore(
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
  const showToast = useToastStore((state) => state.show);

  const [isViewerVisible, setViewerVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [newTag, setNewTag] = useState('');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);

  const currentIndex = useMemo(
    () => screenshots.findIndex((shot) => shot.id === route.params.screenshotId),
    [route.params.screenshotId, screenshots],
  );

  const currentScreenshot = currentIndex >= 0 ? screenshots[currentIndex] : undefined;
  const imageSources = useMemo(() => screenshots.map((shot) => ({uri: shot.uri})), [screenshots]);
  const extractedText = currentScreenshot ? ocrById[currentScreenshot.id] ?? '' : '';
  const similarIds = currentScreenshot ? insightById[currentScreenshot.id]?.similarIds ?? [] : [];

  if (!currentScreenshot) {
    return (
      <View style={[styles.centered, {backgroundColor: theme.colors.background}]}>
        <View style={[styles.notFoundIcon, {borderColor: theme.colors.border}]}>
          <MaterialCommunityIcons name="image-off-outline" size={designTokens.iconSize.lg} color={theme.colors.muted} />
        </View>
        <Text style={[designTokens.typography.titleLarge, {color: theme.colors.text}]}>
          Not found
        </Text>
        <Pressable
          style={[styles.backBtn, {borderColor: theme.colors.border}]}
          onPress={() => navigation.goBack()}>
          <Text style={[designTokens.typography.labelMedium, {color: theme.colors.text}]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const currentAlbum = albums.find((a) => a.id === currentScreenshot.albumId);

  const shareCurrent = async () => {
    try { await shareScreenshot(currentScreenshot); } catch { /* dismissed */ }
  };

  const shareAsText = async () => {
    try { await shareScreenshotAsText(currentScreenshot, extractedText); } catch { /* dismissed */ }
  };

  const copyLink = async () => {
    try {
      await shareDeepLink('screenshot', currentScreenshot.id, currentScreenshot.fileName);
      trackEvent('detail_copy_link', {id: currentScreenshot.id});
    } catch { /* dismissed */ }
  };

  const copyExtractedText = async () => {
    if (!extractedText) {
      showToast('No extracted text available yet.', 'info');
      return;
    }
    try {
      await Share.open({
        title: 'Extracted Text',
        message: extractedText,
        failOnCancel: false,
      });
      trackEvent('detail_view_extracted_text', {id: currentScreenshot.id});
    } catch { /* dismissed */ }
  };

  const addTagToCurrent = () => {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    addTag(currentScreenshot.id, trimmed);
    setNewTag('');
  };

  const handleMoveToAlbum = () => {
    const targets = albums.filter((a) => a.id !== 'all-screenshots');
    if (targets.length === 0) {
      showToast('Create an album from the Albums tab first.', 'warning');
      return;
    }
    Alert.alert(
      'Move to album',
      'Choose a destination:',
      [
        ...targets.map((a) => ({
          text: a.name,
          onPress: () => {
            moveToAlbum([currentScreenshot.id], a.id);
            showToast(`Moved to ${a.name}.`, 'success');
          },
        })),
        {text: 'Cancel', style: 'cancel' as const},
      ],
    );
  };

  const saveNote = () => {
    updateNote(currentScreenshot.id, noteValue.trim());
    setIsEditingNote(false);
    showToast('Note saved.', 'success');
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Image preview */}
        <Pressable onPress={() => { setActiveIndex(Math.max(currentIndex, 0)); setViewerVisible(true); }}>
          <Image
            source={{uri: currentScreenshot.uri}}
            style={[styles.previewImage, {backgroundColor: theme.colors.surfaceVariant}]}
            resizeMode="contain"
          />
          <View style={[styles.previewTopRow, {paddingTop: insets.top + designTokens.spacing.xs}]}>
            <View style={styles.previewCounter}>
              <Text style={styles.previewCounterText}>
                {currentIndex + 1} / {screenshots.length}
              </Text>
            </View>
          </View>
          <View style={styles.expandHint}>
            <MaterialCommunityIcons name="arrow-expand" size={12} color="#fff" />
            <Text style={styles.expandHintText}>expand</Text>
          </View>
        </Pressable>

        {/* Divider */}
        <View style={[styles.divider, {backgroundColor: theme.colors.border}]} />

        {/* File info */}
        <View style={[styles.section, {borderBottomColor: theme.colors.border}]}>
          <View style={styles.fileNameRow}>
            <Text numberOfLines={2} style={[styles.fileName, {color: theme.colors.text}]}>
              {currentScreenshot.fileName}
            </Text>
            {currentScreenshot.isFavorite && (
              <MaterialCommunityIcons name="heart" size={designTokens.iconSize.xs} color={theme.colors.text} />
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.metaText, {color: theme.colors.muted}]}>
              {formatBytes(currentScreenshot.fileSize)}
            </Text>
            <Text style={[styles.metaDot, {color: theme.colors.outlineVariant}]}>·</Text>
            <Text style={[styles.metaText, {color: theme.colors.muted}]}>
              {formatDateTime(currentScreenshot.createdAt)}
            </Text>
            <Text style={[styles.metaDot, {color: theme.colors.outlineVariant}]}>·</Text>
            <Text style={[styles.metaText, {color: theme.colors.muted}]}>
              {currentAlbum?.name ?? 'Unsorted'}
            </Text>
            {similarIds.length > 0 && (
              <>
                <Text style={[styles.metaDot, {color: theme.colors.outlineVariant}]}>·</Text>
                <Text style={[styles.metaText, {color: theme.colors.text}]}>
                  {similarIds.length} similar
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Action row */}
        <View style={[styles.actionRow, {borderBottomColor: theme.colors.border}]}>
          <ActionButton
            icon="share-variant-outline"
            label="Share"
            theme={theme}
            onPress={() => void shareCurrent()}
          />
          <ActionButton
            icon="link-variant"
            label="Link"
            theme={theme}
            onPress={() => void copyLink()}
          />
          <ActionButton
            icon={currentScreenshot.isFavorite ? 'heart' : 'heart-outline'}
            label={currentScreenshot.isFavorite ? 'Saved' : 'Save'}
            theme={theme}
            onPress={() => toggleFavorite(currentScreenshot.id)}
          />
          <ActionButton
            icon="folder-move-outline"
            label="Move"
            theme={theme}
            onPress={handleMoveToAlbum}
          />
          <ActionButton
            icon="text-box-search-outline"
            label="Text"
            theme={theme}
            onPress={() => void copyExtractedText()}
          />
          <ActionButton
            icon="file-document-outline"
            label="Export"
            theme={theme}
            onPress={() => void shareAsText()}
          />
          <ActionButton
            icon="delete-outline"
            label="Delete"
            theme={theme}
            onPress={() => setShowDeleteSheet(true)}
            danger
          />
        </View>

        {/* Tags */}
        <View style={[styles.section, {borderBottomColor: theme.colors.border}]}>
          <Text style={[styles.sectionLabel, {color: theme.colors.muted}]}>TAGS</Text>
          <View style={styles.tagWrap}>
            {currentScreenshot.tags.length === 0 ? (
              <Text style={[styles.emptyMeta, {color: theme.colors.muted}]}>No tags</Text>
            ) : (
              currentScreenshot.tags.map((tag: string) => (
                <Chip
                  key={tag}
                  label={tag}
                  variant="tag"
                  theme={theme}
                  removable
                  onRemove={() => removeTag(currentScreenshot.id, tag)}
                  onPress={() => removeTag(currentScreenshot.id, tag)}
                />
              ))
            )}
          </View>
          <View style={styles.addTagRow}>
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag"
              placeholderTextColor={theme.colors.muted}
              style={[
                styles.tagInput,
                {
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surfaceVariant,
                },
              ]}
              onSubmitEditing={addTagToCurrent}
              returnKeyType="done"
            />
            <Pressable
              style={[
                styles.tagAddBtn,
                {
                  backgroundColor: newTag.trim() ? theme.colors.text : theme.colors.surfaceVariant,
                  borderColor: newTag.trim() ? theme.colors.text : theme.colors.border,
                },
              ]}
              onPress={addTagToCurrent}
              disabled={!newTag.trim()}>
              <Text style={[
                styles.tagAddBtnText,
                {color: newTag.trim() ? theme.colors.surface : theme.colors.muted},
              ]}>
                Add
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Note */}
        <View style={[styles.section, {borderBottomColor: theme.colors.border}]}>
          <View style={styles.noteTitleRow}>
            <Text style={[styles.sectionLabel, {color: theme.colors.muted}]}>NOTE</Text>
            <Pressable
              onPress={() => {
                setNoteValue(currentScreenshot.note ?? '');
                setIsEditingNote((prev) => !prev);
              }}>
              <Text style={[styles.editLink, {color: theme.colors.text}]}>
                {isEditingNote ? 'Cancel' : 'Edit'}
              </Text>
            </Pressable>
          </View>
          {isEditingNote ? (
            <>
              <TextInput
                value={noteValue}
                onChangeText={setNoteValue}
                placeholder="Write a note..."
                placeholderTextColor={theme.colors.muted}
                style={[
                  styles.noteInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceVariant,
                  },
                ]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Pressable
                style={[styles.saveNoteBtn, {backgroundColor: theme.colors.text}]}
                onPress={saveNote}>
                <Text style={[styles.saveNoteBtnText, {color: theme.colors.surface}]}>
                  Save note
                </Text>
              </Pressable>
            </>
          ) : (
            <Text style={[styles.noteText, {color: currentScreenshot.note ? theme.colors.text : theme.colors.muted}]}>
              {currentScreenshot.note || 'No note'}
            </Text>
          )}
        </View>

        {/* Extracted text */}
        {extractedText ? (
          <View style={[styles.section, {borderBottomColor: theme.colors.border}]}>
            <Text style={[styles.sectionLabel, {color: theme.colors.muted}]}>EXTRACTED TEXT</Text>
            <Text
              numberOfLines={5}
              style={[styles.extractedText, {color: theme.colors.textSecondary, backgroundColor: theme.colors.surfaceVariant}]}>
              {extractedText}
            </Text>
            <Pressable onPress={() => void copyExtractedText()} style={styles.copyLink}>
              <Text style={[styles.editLink, {color: theme.colors.text}]}>Share text</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={{height: 80}} />
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

      <ConfirmationSheet
        visible={showDeleteSheet}
        onClose={() => setShowDeleteSheet(false)}
        onConfirm={() => {
          deleteScreenshot(currentScreenshot.id);
          navigation.goBack();
        }}
        theme={theme}
        title="Remove screenshot"
        description="This removes it from the manager list. The original file stays in your gallery."
        confirmLabel="Remove"
        icon="delete-outline"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  scroll: {paddingBottom: designTokens.spacing.xxxl},
  previewImage: {
    width: '100%',
    height: PREVIEW_HEIGHT,
  },
  previewTopRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: designTokens.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCounter: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: designTokens.radius.full,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: 3,
  },
  previewCounterText: {
    color: '#fff',
    ...designTokens.typography.caption,
  },
  expandHint: {
    position: 'absolute',
    bottom: designTokens.spacing.sm,
    right: designTokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: designTokens.radius.xs,
    paddingHorizontal: designTokens.spacing.xs,
    paddingVertical: 3,
  },
  expandHintText: {
    color: '#fff',
    ...designTokens.typography.caption,
  },
  divider: {height: 1},
  section: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderBottomWidth: 1,
    gap: designTokens.spacing.sm,
  },
  sectionLabel: {
    ...designTokens.typography.labelSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: designTokens.spacing.sm,
  },
  fileName: {
    ...designTokens.typography.titleMedium,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: designTokens.spacing.xs,
  },
  metaText: {
    ...designTokens.typography.bodySmall,
  },
  metaDot: {
    ...designTokens.typography.bodySmall,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.md,
    borderBottomWidth: 1,
    gap: designTokens.spacing.xs,
  },
  actionBtn: {flex: 1, alignItems: 'center', gap: designTokens.spacing.xxs},
  actionBtnInner: {
    width: 44,
    height: 44,
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    ...designTokens.typography.caption,
  },
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.sm,
  },
  emptyMeta: {
    ...designTokens.typography.bodySmall,
  },
  addTagRow: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.md,
    height: 38,
    ...designTokens.typography.bodySmall,
  },
  tagAddBtn: {
    borderRadius: designTokens.radius.sm,
    borderWidth: 1,
    paddingHorizontal: designTokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  tagAddBtnText: {
    ...designTokens.typography.labelMedium,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editLink: {
    ...designTokens.typography.labelMedium,
  },
  noteText: {
    ...designTokens.typography.bodyMedium,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: designTokens.radius.sm,
    padding: designTokens.spacing.md,
    minHeight: 72,
    ...designTokens.typography.bodyMedium,
  },
  saveNoteBtn: {
    borderRadius: designTokens.radius.sm,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveNoteBtnText: {
    ...designTokens.typography.labelLarge,
  },
  extractedText: {
    ...designTokens.typography.mono,
    borderRadius: designTokens.radius.sm,
    padding: designTokens.spacing.md,
  },
  copyLink: {alignSelf: 'flex-start'},
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.lg,
  },
  notFoundIcon: {
    width: 72,
    height: 72,
    borderRadius: designTokens.radius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
    paddingHorizontal: designTokens.spacing.xl,
    paddingVertical: designTokens.spacing.sm,
  },
});
