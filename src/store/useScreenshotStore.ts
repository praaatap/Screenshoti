import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {create} from 'zustand';
import type {Screenshot, ScreenshotState} from '../types';
import {isLikelyScreenshot, mapCameraRollPhoto} from '../utils/screenshotUtils';

const createScreenshotMap = (screenshots: Screenshot[]): Map<string, Screenshot> => {
  return new Map(screenshots.map((screenshot) => [screenshot.uri, screenshot]));
};

const byDateDesc = (a: Screenshot, b: Screenshot): number => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
};

const toErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load screenshots. Please try again.';
};

export const useScreenshotStore = create<ScreenshotState>()((set, get) => ({
  screenshots: [],
  selectedScreenshots: [],
  isLoading: false,
  error: null,

  loadScreenshots: async () => {
    set({isLoading: true, error: null});

    try {
      const result = await CameraRoll.getPhotos({
        first: 150,
        assetType: 'Photos',
        groupTypes: 'All',
        include: ['filename', 'fileSize', 'imageSize'],
      });

      const existingByUri = createScreenshotMap(get().screenshots);
      const allPhotos = result.edges.map((edge) => mapCameraRollPhoto(edge, existingByUri));

      const screenshotOnly = allPhotos.filter((item) => isLikelyScreenshot(item.fileName));
      const screenshots = (screenshotOnly.length > 0 ? screenshotOnly : allPhotos).sort(byDateDesc);

      set({
        screenshots,
        isLoading: false,
        error: null,
        selectedScreenshots: get().selectedScreenshots.filter((id) =>
          screenshots.some((shot) => shot.id === id),
        ),
      });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: toErrorMessage(error),
      });
    }
  },

  deleteScreenshot: (id: string) => {
    set((state) => ({
      screenshots: state.screenshots.filter((screenshot) => screenshot.id !== id),
      selectedScreenshots: state.selectedScreenshots.filter((selectedId) => selectedId !== id),
    }));
  },

  deleteMultiple: (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);

    set((state) => ({
      screenshots: state.screenshots.filter((screenshot) => !idSet.has(screenshot.id)),
      selectedScreenshots: state.selectedScreenshots.filter((selectedId) => !idSet.has(selectedId)),
    }));
  },

  toggleFavorite: (id: string) => {
    set((state) => ({
      screenshots: state.screenshots.map((screenshot) =>
        screenshot.id === id ? {...screenshot, isFavorite: !screenshot.isFavorite} : screenshot,
      ),
    }));
  },

  addTag: (id: string, tag: string) => {
    const normalized = tag.trim();

    if (!normalized) {
      return;
    }

    set((state) => ({
      screenshots: state.screenshots.map((screenshot) => {
        if (screenshot.id !== id || screenshot.tags.includes(normalized)) {
          return screenshot;
        }

        return {...screenshot, tags: [...screenshot.tags, normalized]};
      }),
    }));
  },

  removeTag: (id: string, tag: string) => {
    set((state) => ({
      screenshots: state.screenshots.map((screenshot) => {
        if (screenshot.id !== id) {
          return screenshot;
        }

        return {
          ...screenshot,
          tags: screenshot.tags.filter((existingTag) => existingTag !== tag),
        };
      }),
    }));
  },

  selectScreenshot: (id: string) => {
    set((state) => {
      if (state.selectedScreenshots.includes(id)) {
        return state;
      }

      return {selectedScreenshots: [...state.selectedScreenshots, id]};
    });
  },

  deselectScreenshot: (id: string) => {
    set((state) => ({
      selectedScreenshots: state.selectedScreenshots.filter((selectedId) => selectedId !== id),
    }));
  },

  clearSelection: () => {
    set({selectedScreenshots: []});
  },

  selectAll: () => {
    set((state) => ({
      selectedScreenshots: state.screenshots.map((screenshot) => screenshot.id),
    }));
  },

  moveToAlbum: (ids: string[], albumId: string) => {
    if (ids.length === 0) {
      return;
    }

    const idSet = new Set(ids);

    set((state) => ({
      screenshots: state.screenshots.map((screenshot) =>
        idSet.has(screenshot.id) ? {...screenshot, albumId} : screenshot,
      ),
    }));
  },
}));
