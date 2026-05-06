import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppConfig} from '../../config';
import {buildDemoAlbums, buildDemoScreenshots} from './seedData';
import {useScreenshotStore} from '../../store/useScreenshotStore';
import {useAlbumStore} from '../../store/useAlbumStore';

const SEED_KEY = '@screenshoti:demo_seeded_v1';

export const seedDemoDataIfNeeded = async (): Promise<void> => {
  if (!AppConfig.demoMode) return;

  const alreadySeeded = await AsyncStorage.getItem(SEED_KEY).catch(() => null);
  if (alreadySeeded === 'true') return;

  const screenshots = buildDemoScreenshots(AppConfig.demoScreenshotCount);
  const albums = buildDemoAlbums();

  useScreenshotStore.setState({screenshots, isLoading: false, error: null});

  albums.forEach((album) => {
    const alreadyExists = useAlbumStore
      .getState()
      .albums.some((a) => a.id === album.id);
    if (!alreadyExists) {
      useAlbumStore.setState((state) => ({
        albums: [...state.albums, album],
      }));
    }
  });

  await AsyncStorage.setItem(SEED_KEY, 'true').catch(() => undefined);
};

export const clearDemoSeedFlag = async (): Promise<void> => {
  await AsyncStorage.removeItem(SEED_KEY).catch(() => undefined);
};
