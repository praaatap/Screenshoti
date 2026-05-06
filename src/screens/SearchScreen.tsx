import React, {useState} from 'react';
import {KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type {SmartCategory} from '../domain/organization/smartGrouping';
import {ScreenshotGrid} from '../components/ScreenshotGrid';
import {Chip} from '../components/ui/Chip';
import {useFilteredScreenshots} from '../hooks/useFilteredScreenshots';
import {useFilterStore} from '../store/useFilterStore';
import {useIntelligenceStore} from '../store/useIntelligenceStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import {trackEvent} from '../services/observability/analytics';
import {designTokens} from '../theme/tokens';
import type {SearchScreenProps} from '../types';

const CATEGORY_ICONS: Record<string, string> = {
  all: 'apps',
  receipt: 'receipt',
  shopping: 'shopping-outline',
  code: 'code-braces',
  design: 'vector-square',
  docs: 'file-document-outline',
  social: 'account-multiple-outline',
};

export const SearchScreen: React.FC<SearchScreenProps> = ({navigation}) => {
  const theme = useThemeStore((state) => state.theme);
  const insets = useSafeAreaInsets();
  const loadScreenshots = useScreenshotStore((state) => state.loadScreenshots);
  const selectedScreenshots = useScreenshotStore((state) => state.selectedScreenshots);
  const selectScreenshot = useScreenshotStore((state) => state.selectScreenshot);
  const deselectScreenshot = useScreenshotStore((state) => state.deselectScreenshot);
  const isLoading = useScreenshotStore((state) => state.isLoading);
  const error = useScreenshotStore((state) => state.error);

  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const activeTag = useFilterStore((state) => state.activeTag);
  const setActiveTag = useFilterStore((state) => state.setActiveTag);
  const selectedSmartCategory = useIntelligenceStore((state) => state.selectedSmartCategory);
  const setSelectedSmartCategory = useIntelligenceStore((state) => state.setSelectedSmartCategory);
  const recentQueries = useIntelligenceStore((state) => state.recentQueries);
  const saveQuery = useIntelligenceStore((state) => state.saveQuery);

  const {filteredScreenshots, allTags} = useFilteredScreenshots();
  const selectionMode = selectedScreenshots.length > 0;
  const [showRecent, setShowRecent] = useState(true);
  const [showTags, setShowTags] = useState(true);

  const categories: Array<SmartCategory | 'all'> = [
    'all', 'receipt', 'shopping', 'code', 'design', 'docs', 'social',
  ];

  const hasFiltersActive =
    searchQuery.trim().length > 0 || activeTag !== null || selectedSmartCategory !== 'all';

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Search header */}
      <View style={[
        styles.header,
        {
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          paddingTop: Math.max(insets.top, designTokens.spacing.sm),
        },
      ]}>
        <Pressable
          style={[styles.backButton, {borderColor: theme.colors.border}]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialCommunityIcons
            name="arrow-left"
            size={designTokens.iconSize.sm}
            color={theme.colors.text}
          />
        </Pressable>

        <View style={[styles.searchWrap, {borderColor: theme.colors.border}]}>
          <MaterialCommunityIcons
            name="magnify"
            size={designTokens.iconSize.xs}
            color={theme.colors.muted}
          />
          <TextInput
            value={searchQuery}
            onChangeText={(value) => {
              setSearchQuery(value);
              if (value.trim().length > 2) {
                trackEvent('search_typing', {length: value.length});
              }
            }}
            placeholder="Search by name or tags"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, {color: theme.colors.text}]}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => {
              saveQuery(searchQuery);
              trackEvent('search_submit', {query: searchQuery});
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={designTokens.iconSize.xs}
                color={theme.colors.muted}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.categoryBar, {borderBottomColor: theme.colors.border}]}>
        {categories.map((category) => (
          <Chip
            key={category}
            label={category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            isActive={selectedSmartCategory === category}
            icon={CATEGORY_ICONS[category]}
            variant="filter"
            theme={theme}
            onPress={() => setSelectedSmartCategory(category)}
          />
        ))}
      </ScrollView>

      {/* Recent queries */}
      {recentQueries.length > 0 && (
        <View>
          <Pressable
            style={[styles.sectionHeader, {borderBottomColor: theme.colors.border}]}
            onPress={() => setShowRecent((p) => !p)}>
            <Text style={[styles.sectionTitle, {color: theme.colors.muted}]}>Recent</Text>
            <MaterialCommunityIcons
              name={showRecent ? 'chevron-up' : 'chevron-down'}
              size={designTokens.iconSize.xs}
              color={theme.colors.muted}
            />
          </Pressable>
          {showRecent && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}>
              {recentQueries.map((query) => (
                <Chip
                  key={query}
                  label={query}
                  variant="tag"
                  icon="history"
                  theme={theme}
                  onPress={() => setSearchQuery(query)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Tags */}
      {allTags.length > 0 && (
        <View>
          <Pressable
            style={[styles.sectionHeader, {borderBottomColor: theme.colors.border}]}
            onPress={() => setShowTags((p) => !p)}>
            <Text style={[styles.sectionTitle, {color: theme.colors.muted}]}>Tags</Text>
            <MaterialCommunityIcons
              name={showTags ? 'chevron-up' : 'chevron-down'}
              size={designTokens.iconSize.xs}
              color={theme.colors.muted}
            />
          </Pressable>
          {showTags && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}>
              <Chip
                label="All"
                isActive={activeTag === null}
                variant="tag"
                theme={theme}
                onPress={() => setActiveTag(null)}
              />
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  isActive={activeTag === tag}
                  variant="tag"
                  theme={theme}
                  onPress={() => setActiveTag(activeTag === tag ? null : tag)}
                />
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {!hasFiltersActive && filteredScreenshots.length > 0 && (
        <View style={[styles.hint, {borderBottomColor: theme.colors.border}]}>
          <Text style={[styles.hintText, {color: theme.colors.muted}]}>
            Pick a category, tag, or type to filter
          </Text>
        </View>
      )}

      <ScreenshotGrid
        screenshots={filteredScreenshots}
        selectedIds={selectedScreenshots}
        selectionMode={selectionMode}
        isLoading={isLoading}
        error={error}
        refreshing={false}
        theme={theme}
        onPressItem={(item) => {
          if (selectionMode) {
            if (selectedScreenshots.includes(item.id)) {
              deselectScreenshot(item.id);
            } else {
              selectScreenshot(item.id);
            }
            return;
          }
          navigation.navigate('Detail', {screenshotId: item.id});
        }}
        onLongPressItem={(item) => {
          if (selectedScreenshots.includes(item.id)) {
            deselectScreenshot(item.id);
          } else {
            selectScreenshot(item.id);
          }
        }}
        onRefresh={() => void loadScreenshots()}
        onRetry={() => void loadScreenshots()}
        emptyTitle="No matches"
        emptyDescription="Try a different keyword, tag, or clear the active filters."
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: designTokens.radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: designTokens.radius.md,
    paddingHorizontal: designTokens.spacing.md,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  input: {
    flex: 1,
    ...designTokens.typography.bodyMedium,
    paddingVertical: 0,
  },
  categoryBar: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    ...designTokens.typography.labelSmall,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chipRow: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    gap: designTokens.spacing.sm,
  },
  hint: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderBottomWidth: 1,
  },
  hintText: {
    ...designTokens.typography.bodySmall,
  },
});
