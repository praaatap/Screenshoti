import React, {useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
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
  all: 'view-grid',
  receipt: 'receipt',
  shopping: 'shopping',
  code: 'code-braces',
  design: 'palette',
  docs: 'file-document-outline',
  social: 'account-group',
};

export const SearchScreen: React.FC<SearchScreenProps> = ({navigation}) => {
  const theme = useThemeStore((state) => state.theme);
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

  const hasFiltersActive = searchQuery.trim().length > 0 || activeTag !== null || selectedSmartCategory !== 'all';

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={[styles.header, designTokens.elevation.low, {backgroundColor: theme.colors.surface}]}>
        <Pressable
          style={[styles.backButton, {backgroundColor: theme.colors.surfaceVariant}]}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={designTokens.iconSize.md} color={theme.colors.text} />
        </Pressable>

        <View style={[styles.searchWrap, {backgroundColor: theme.colors.background}]}>
          <MaterialCommunityIcons name="magnify" size={designTokens.iconSize.sm} color={theme.colors.muted} />
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
            style={[designTokens.typography.bodyMedium, styles.input, {color: theme.colors.text}]}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => {
              saveQuery(searchQuery);
              trackEvent('search_submit', {query: searchQuery});
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={designTokens.iconSize.sm} color={theme.colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryBar}>
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

      {/* Recent queries - collapsible */}
      {recentQueries.length > 0 && (
        <View>
          <Pressable style={styles.sectionHeader} onPress={() => setShowRecent((p) => !p)}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="history" size={designTokens.iconSize.xs} color={theme.colors.muted} />
              <Text style={[designTokens.typography.labelMedium, {color: theme.colors.muted}]}>Recent</Text>
            </View>
            <MaterialCommunityIcons
              name={showRecent ? 'chevron-up' : 'chevron-down'}
              size={designTokens.iconSize.sm}
              color={theme.colors.muted}
            />
          </Pressable>
          {showRecent && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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

      {/* Tags - collapsible */}
      {allTags.length > 0 && (
        <View>
          <Pressable style={styles.sectionHeader} onPress={() => setShowTags((p) => !p)}>
            <View style={styles.sectionHeaderLeft}>
              <MaterialCommunityIcons name="tag-multiple" size={designTokens.iconSize.xs} color={theme.colors.muted} />
              <Text style={[designTokens.typography.labelMedium, {color: theme.colors.muted}]}>Tags</Text>
            </View>
            <MaterialCommunityIcons
              name={showTags ? 'chevron-up' : 'chevron-down'}
              size={designTokens.iconSize.sm}
              color={theme.colors.muted}
            />
          </Pressable>
          {showTags && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              <Chip
                label="All tags"
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

      {/* Empty discover state */}
      {!hasFiltersActive && filteredScreenshots.length > 0 && (
        <View style={styles.discoverHint}>
          <MaterialCommunityIcons name="compass-outline" size={designTokens.iconSize.sm} color={theme.colors.muted} />
          <Text style={[designTokens.typography.bodySmall, {color: theme.colors.muted}]}>
            Pick a category or type to search
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
        onRefresh={() => { void loadScreenshots(); }}
        onRetry={() => { void loadScreenshots(); }}
        emptyTitle="No matches found"
        emptyDescription="Try another name, tag, or clear active filters."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: designTokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: 1,
    borderRadius: designTokens.radius.md,
    paddingHorizontal: designTokens.spacing.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  input: {flex: 1},
  categoryBar: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.md,
    paddingBottom: designTokens.spacing.xs,
    gap: designTokens.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.lg,
    paddingTop: designTokens.spacing.sm,
    paddingBottom: designTokens.spacing.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.xs,
  },
  chipRow: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingBottom: designTokens.spacing.xs,
    gap: designTokens.spacing.sm,
  },
  discoverHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.sm,
  },
});
