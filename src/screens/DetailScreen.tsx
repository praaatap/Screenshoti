import React, {useCallback, useMemo, useState} from 'react';
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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ImageView from 'react-native-image-viewing';
import Share from 'react-native-share';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useShallow} from 'zustand/react/shallow';
import {trackEvent} from '../services/observability/analytics';
import {useAlbumStore} from '../store/useAlbumStore';
import {useIntelligenceStore} from '../store/useIntelligenceStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import {useToastStore} from '../store/useToastStore';
import {ConfirmationSheet} from '../components/ui/ConfirmationSheet';
import {SectionCard} from '../components/ui/SectionCard';
import {Chip} from '../components/ui/Chip';
import {designTokens} from '../theme/tokens';
import type {DetailScreenProps} from '../types';
import {formatBytes, formatDateTime} from '../utils/formatters';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const PREVIEW_HEIGHT = Math.round(SCREEN_HEIGHT * 0.38);

interface ActionIconProps {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

const ActionIcon: React.FC<ActionIconProps> = ({icon, label, color, onPress}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));

  return (
    <Animated.View style={[{flex: 1}, animStyle]}>
      <Pressable
        style={styles.actionIcon}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.9); }}
        onPressOut={() => { scale.value = withSpring(1); }}>
        <MaterialCommunityIcons name={icon} size={designTokens.iconSize.md} color={color} />
        <Text style={[designTokens.typography.caption, {color}]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
};

export const DetailScreen: React.FC<DetailScreenProps> = ({navigation, route}) => {
  const theme = useThemeStore((state) => state.theme);
  const insets = useSafeAreaInsets();

  const {
    screenshots,
    toggleFavorite,
    deleteScreenshot,
    addTag,
    removeTag,
    moveToAlbum,
    updateNote,
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
        <View style={[styles.emptyIcon, {backgroundColor: theme.colors.surfaceVariant}]}>
          <MaterialCommunityIcons name="image-broken-variant" size={designTokens.iconSize.xl} color={theme.colors.muted} />
        </View>
        <Text style={[designTokens.typography.headlineMedium, {color: theme.colors.text}]}>Screenshot not found</Text>
        <Pressable
          style={[styles.backButton, {backgroundColor: theme.colors.primary}]}
          onPress={() => navigation.goBack()}>
          <Text style={[designTokens.typography.labelLarge, {color: '#ffffff'}]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const currentAlbum = albums.find((a) => a.id === currentScreenshot.albumId);

  const openViewer = () => {
    setActiveIndex(Math.max(currentIndex, 0));
    setViewerVisible(true);
  };

  const shareCurrent = async () => {
    try {
      await Share.open({url: currentScreenshot.uri});
      trackEvent('detail_share_image', {id: currentScreenshot.id});
    } catch { /* dismissed */ }
  };

  const shareAsPdfSummary = async () => {
    const text = [
      `Screenshot: ${currentScreenshot.fileName}`,
      `Date: ${formatDateTime(currentScreenshot.createdAt)}`,
      `Size: ${formatBytes(currentScreenshot.fileSize)}`,
      '',
      'Extracted text:',
      extractedText || 'No extracted text available',
    ].join('\n');
    try {
      await Share.open({title: 'Screenshot Summary', message: text});
      trackEvent('detail_export_summary', {id: currentScreenshot.id});
    } catch { /* dismissed */ }
  };

  const copyExtractedText = () => {
    if (!extractedText) {
      showToast('No extracted text available yet.', 'info');
      return;
    }
    showToast('Extracted text copied!', 'success');
    trackEvent('detail_view_extracted_text', {id: currentScreenshot.id});
  };

  const deleteCurrent = () => { setShowDeleteSheet(true); };
  const confirmDeleteCurrent = () => {
    deleteScreenshot(currentScreenshot.id);
    navigation.goBack();
  };

  const addTagToCurrent = () => {
    const trimmed = newTag.trim();
    if (!trimmed) {return;}
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Large image preview */}
        <Pressable onPress={openViewer} style={styles.previewWrap}>
          <Image
            source={{uri: currentScreenshot.uri}}
            style={styles.previewImage}
            resizeMode="contain"
          />
          <View style={styles.previewCounter}>
            <Text style={styles.previewCounterText}>
              {currentIndex + 1} / {screenshots.length}
            </Text>
          </View>
          <View style={styles.previewHint}>
            <MaterialCommunityIcons name="loupe" size={designTokens.iconSize.xs} color="#fff" />
            <Text style={[designTokens.typography.caption, {color: '#fff'}]}>Tap to expand</Text>
          </View>
        </Pressable>

        {/* Metadata + Tags + Note - consolidated */}
        <SectionCard theme={theme}>
          {/* File info */}
          <View style={styles.fileRow}>
            <Text numberOfLines={2} style={[designTokens.typography.titleMedium, {color: theme.colors.text, flex: 1}]}>
              {currentScreenshot.fileName}
            </Text>
            {currentScreenshot.isFavorite && (
              <MaterialCommunityIcons name="heart" size={designTokens.iconSize.sm} color="#f43f5e" />
            )}
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="harddisk" size={designTokens.iconSize.xs} color={theme.colors.muted} />
            <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>{formatBytes(currentScreenshot.fileSize)}</Text>
            <Text style={[designTokens.typography.bodySmall, {color: theme.colors.outlineVariant}]}>·</Text>
            <MaterialCommunityIcons name="calendar" size={designTokens.iconSize.xs} color={theme.colors.muted} />
            <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>{formatDateTime(currentScreenshot.createdAt)}</Text>
          </View>

          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="folder" size={designTokens.iconSize.xs} color={theme.colors.muted} />
            <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>{currentAlbum?.name ?? 'Unsorted'}</Text>
            {similarIds.length > 0 && (
              <>
                <Text style={[designTokens.typography.bodySmall, {color: theme.colors.outlineVariant}]}>·</Text>
                <Text style={[designTokens.typography.bodySmall, {color: theme.colors.primary}]}>{similarIds.length} similar</Text>
              </>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.divider, {backgroundColor: theme.colors.outlineVariant}]} />

          {/* Tags */}
          <Text style={[designTokens.typography.labelMedium, {color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 0.5}]}>Tags</Text>
          <View style={styles.tagWrap}>
            {currentScreenshot.tags.length === 0 ? (
              <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>No tags yet</Text>
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
              placeholder="Add a tag"
              placeholderTextColor={theme.colors.muted}
              style={[
                styles.tagInput,
                designTokens.typography.bodyMedium,
                {color: theme.colors.text, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.background},
              ]}
              onSubmitEditing={addTagToCurrent}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.tagAddButton, {backgroundColor: newTag.trim() ? theme.colors.primary : theme.colors.outlineVariant}]}
              onPress={addTagToCurrent}
              disabled={!newTag.trim()}>
              <Text style={[designTokens.typography.labelMedium, {color: '#ffffff'}]}>Add</Text>
            </Pressable>
          </View>

          {/* Divider */}
          <View style={[styles.divider, {backgroundColor: theme.colors.outlineVariant}]} />

          {/* Note */}
          <View style={styles.noteTitleRow}>
            <Text style={[designTokens.typography.labelMedium, {color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 0.5}]}>Note</Text>
            <Pressable onPress={() => { setNoteValue(currentScreenshot.note ?? ''); setIsEditingNote((prev) => !prev); }}>
              <Text style={[designTokens.typography.labelMedium, {color: theme.colors.primary}]}>
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
                  designTokens.typography.bodyMedium,
                  {color: theme.colors.text, borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.background},
                ]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Pressable style={[styles.saveButton, {backgroundColor: theme.colors.primary}]} onPress={saveNote}>
                <Text style={[designTokens.typography.labelLarge, {color: '#fff'}]}>Save note</Text>
              </Pressable>
            </>
          ) : (
            <Text style={[designTokens.typography.bodyMedium, {color: currentScreenshot.note ? theme.colors.text : theme.colors.muted}]}>
              {currentScreenshot.note || 'No note added'}
            </Text>
          )}
        </SectionCard>

        {/* Extracted text */}
        {extractedText ? (
          <SectionCard title="Extracted Text" theme={theme}>
            <Text numberOfLines={4} style={[designTokens.typography.bodySmall, {color: theme.colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'}]}>
              {extractedText}
            </Text>
            <Pressable onPress={copyExtractedText}>
              <Text style={[designTokens.typography.labelMedium, {color: theme.colors.primary, marginTop: designTokens.spacing.xs}]}>Copy text</Text>
            </Pressable>
          </SectionCard>
        ) : null}

        <View style={{height: 100}} />
      </ScrollView>

      {/* Sticky bottom action bar */}
      <View
        style={[
          styles.bottomActions,
          designTokens.elevation.medium,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: insets.bottom + designTokens.spacing.sm,
          },
        ]}>
        <ActionIcon icon="share-variant-outline" label="Share" color={theme.colors.text} onPress={() => { void shareCurrent(); }} />
        <ActionIcon
          icon={currentScreenshot.isFavorite ? 'heart' : 'heart-outline'}
          label={currentScreenshot.isFavorite ? 'Unfave' : 'Fave'}
          color={currentScreenshot.isFavorite ? '#f43f5e' : theme.colors.text}
          onPress={() => toggleFavorite(currentScreenshot.id)}
        />
        <ActionIcon icon="folder-move-outline" label="Move" color={theme.colors.text} onPress={handleMoveToAlbum} />
        <ActionIcon icon="text-box-search-outline" label="Extract" color={theme.colors.text} onPress={copyExtractedText} />
        <ActionIcon icon="file-document-outline" label="PDF" color={theme.colors.text} onPress={() => { void shareAsPdfSummary(); }} />
        <ActionIcon icon="delete-outline" label="Remove" color={theme.colors.danger} onPress={deleteCurrent} />
      </View>

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
        onConfirm={confirmDeleteCurrent}
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
  content: {paddingHorizontal: designTokens.spacing.lg, paddingVertical: designTokens.spacing.lg, gap: designTokens.spacing.lg},
  previewWrap: {borderRadius: designTokens.radius.xl, overflow: 'hidden', position: 'relative'},
  previewImage: {width: '100%', height: PREVIEW_HEIGHT, backgroundColor: '#00000010', borderRadius: designTokens.radius.xl},
  previewCounter: {
    position: 'absolute',
    top: designTokens.spacing.md,
    left: designTokens.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: designTokens.radius.full,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
  },
  previewCounterText: {color: '#fff', ...designTokens.typography.labelSmall},
  previewHint: {
    position: 'absolute',
    bottom: designTokens.spacing.md,
    right: designTokens.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: designTokens.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
  },
  fileRow: {flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: designTokens.spacing.sm},
  metaRow: {flexDirection: 'row', alignItems: 'center', gap: designTokens.spacing.sm},
  divider: {height: StyleSheet.hairlineWidth, marginVertical: designTokens.spacing.xs},
  tagWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: designTokens.spacing.sm},
  addTagRow: {flexDirection: 'row', gap: designTokens.spacing.sm},
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.md,
    height: 40,
  },
  tagAddButton: {
    borderRadius: designTokens.radius.sm,
    paddingHorizontal: designTokens.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  noteInput: {
    borderWidth: 1,
    borderRadius: designTokens.radius.sm,
    padding: designTokens.spacing.md,
    minHeight: 80,
  },
  saveButton: {borderRadius: designTokens.radius.sm, height: 40, alignItems: 'center', justifyContent: 'center'},
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.md,
    borderTopLeftRadius: designTokens.radius.xl,
    borderTopRightRadius: designTokens.radius.xl,
  },
  actionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.xs,
    paddingVertical: designTokens.spacing.sm,
  },
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: designTokens.spacing.lg},
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: designTokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {borderRadius: designTokens.radius.md, paddingHorizontal: designTokens.spacing.xl, paddingVertical: designTokens.spacing.md},
});
