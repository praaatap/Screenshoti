import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';
import {ScreenshotGrid} from '../components/ScreenshotGrid';
import {useFilteredScreenshots} from '../hooks/useFilteredScreenshots';
import {useScreenshotStore} from '../store/useScreenshotStore';
import {useThemeStore} from '../store/useThemeStore';
import type {AlbumDetailScreenProps} from '../types';

export const AlbumDetailScreen: React.FC<AlbumDetailScreenProps> = ({navigation, route}) => {
  const theme = useThemeStore((state) => state.theme);
  const screenshots = useScreenshotStore((state) => state.screenshots);
  const loadScreenshots = useScreenshotStore((state) => state.loadScreenshots);
  const selectedScreenshots = useScreenshotStore((state) => state.selectedScreenshots);
  const selectScreenshot = useScreenshotStore((state) => state.selectScreenshot);
  const deselectScreenshot = useScreenshotStore((state) => state.deselectScreenshot);
  const isLoading = useScreenshotStore((state) => state.isLoading);
  const error = useScreenshotStore((state) => state.error);

  const albumSource = useMemo(
    () => screenshots.filter((shot) => shot.albumId === route.params.albumId),
    [route.params.albumId, screenshots],
  );

  const {filteredScreenshots} = useFilteredScreenshots({source: albumSource});

  const selectionMode = selectedScreenshots.length > 0;

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
        emptyTitle="Album is empty"
        emptyDescription="Move screenshots into this album from Home or Detail actions."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
