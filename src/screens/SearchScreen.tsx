import React from 'react';
import {Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ScreenshotGrid} from '../components/ScreenshotGrid';
import {useFilteredScreenshots} from '../hooks/useFilteredScreenshots';
import {useFilterStore} from '../store/useFilterStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import type {SearchScreenProps} from '../types';

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

  const {filteredScreenshots, allTags} = useFilteredScreenshots();

  const selectionMode = selectedScreenshots.length > 0;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}> 
      <View style={[styles.header, {borderColor: theme.colors.border, backgroundColor: theme.colors.surface}]}> 
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>

        <View style={[styles.searchWrap, {borderColor: theme.colors.border, backgroundColor: theme.colors.background}]}> 
          <MaterialCommunityIcons name="magnify" size={18} color={theme.colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or tags"
            placeholderTextColor={theme.colors.muted}
            style={[styles.input, {color: theme.colors.text}]}
            autoFocus
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagScroller}
        contentContainerStyle={styles.tagScrollerContent}>
        <Pressable
          style={[
            styles.tagChip,
            {
              backgroundColor: activeTag === null ? theme.colors.primary : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => setActiveTag(null)}>
          <Text style={[styles.tagLabel, {color: activeTag === null ? '#ffffff' : theme.colors.text}]}>All tags</Text>
        </Pressable>

        {allTags.map((tag) => {
          const isActive = activeTag === tag;

          return (
            <Pressable
              key={tag}
              style={[
                styles.tagChip,
                {
                  backgroundColor: isActive ? theme.colors.primary : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
              onPress={() => setActiveTag(isActive ? null : tag)}>
              <Text style={[styles.tagLabel, {color: isActive ? '#ffffff' : theme.colors.text}]}>{tag}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
        onRefresh={() => {
          void loadScreenshots();
        }}
        onRetry={() => {
          void loadScreenshots();
        }}
        emptyTitle="No matches found"
        emptyDescription="Try another name, tag, or clear active filters."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  tagScroller: {
    maxHeight: 60,
  },
  tagScrollerContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  tagChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
