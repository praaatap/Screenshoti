import {create} from 'zustand';
import type {AlbumState} from '../types';
import {useScreenshotStore} from './useScreenshotStore';

const createAlbumId = (): string => `album-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export const useAlbumStore = create<AlbumState>()((set) => ({
  albums: [
    {
      id: 'all-screenshots',
      name: 'All Screenshots',
      coverUri: null,
      screenshotCount: 0,
      createdAt: new Date().toISOString(),
    },
  ],

  createAlbum: (name: string) => {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    set((state) => {
      const alreadyExists = state.albums.some(
        (album) => album.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
      );

      if (alreadyExists) {
        return state;
      }

      return {
        albums: [
          ...state.albums,
          {
            id: createAlbumId(),
            name: trimmed,
            coverUri: null,
            screenshotCount: 0,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  },

  deleteAlbum: (id: string) => {
    if (id === 'all-screenshots') {
      return;
    }

    set((state) => ({
      albums: state.albums.filter((album) => album.id !== id),
    }));

    useScreenshotStore.setState((state) => ({
      screenshots: state.screenshots.map((screenshot) =>
        screenshot.albumId === id ? {...screenshot, albumId: null} : screenshot,
      ),
    }));
  },

  renameAlbum: (id: string, newName: string) => {
    const trimmed = newName.trim();

    if (!trimmed || id === 'all-screenshots') {
      return;
    }

    set((state) => ({
      albums: state.albums.map((album) => (album.id === id ? {...album, name: trimmed} : album)),
    }));
  },
}));
