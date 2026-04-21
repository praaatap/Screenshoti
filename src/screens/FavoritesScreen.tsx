import React, {useCallback, useMemo} from 'react';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {StyleSheet, View} from 'react-native';
import {ScreenshotGrid} from '../components/ScreenshotGrid';
import {useFilteredScreenshots} from '../hooks/useFilteredScreenshots';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import type {FavoritesScreenProps, RootStackParamList, Screenshot} from '../types';

export const FavoritesScreen: React.FC<FavoritesScreenProps> = () => {
  const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useThemeStore((state) => state.theme);
  const screenshots = useScreenshotStore((state) => state.screenshots);
  const selectedScreenshots = useScreenshotStore((state) => state.selectedScreenshots);
  const selectScreenshot = useScreenshotStore((state) => state.selectScreenshot);
  const deselectScreenshot = useScreenshotStore((state) => state.deselectScreenshot);
  const loadScreenshots = useScreenshotStore((state) => state.loadScreenshots);
  const isLoading = useScreenshotStore((state) => state.isLoading);
  const error = useScreenshotStore((state) => state.error);

  const favoriteSource = useMemo(() => screenshots.filter((shot) => shot.isFavorite), [screenshots]);

  const {filteredScreenshots} = useFilteredScreenshots({
    source: favoriteSource,
    favoritesOnly: true,
  });

  const selectionMode = selectedScreenshots.length > 0;

  const toggleSelection = useCallback(
    (id: string) => {
      if (selectedScreenshots.includes(id)) {
        deselectScreenshot(id);
      } else {
        selectScreenshot(id);
      }
    },
    [deselectScreenshot, selectScreenshot, selectedScreenshots],
  );

  const handleLongPress = useCallback(
    (item: Screenshot) => {
      toggleSelection(item.id);
    },
    [toggleSelection],
  );

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}> 
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
            toggleSelection(item.id);
            return;
          }

          rootNavigation.navigate('Detail', {screenshotId: item.id});
        }}
        onLongPressItem={handleLongPress}
        onRefresh={() => {
          void loadScreenshots();
        }}
        onRetry={() => {
          void loadScreenshots();
        }}
        emptyTitle="No favorites yet"
        emptyDescription="Tap the heart icon on any screenshot to pin it here."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
