import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import type {Screenshot, ScreenshotState} from '../types';
import {isLikelyScreenshot, mapCameraRollPhoto} from '../utils/screenshotUtils';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100;
const MAX_PAGES = 5; // cap at 500 total screenshots to protect memory

// ─── Pure helpers (outside store — no re-creation on every set()) ─────────────

const buildUriMap = (screenshots: Screenshot[]): Map<string, Screenshot> =>
  new Map(screenshots.map((s) => [s.uri, s]));

const byDateDesc = (a: Screenshot, b: Screenshot): number =>
  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

const toErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unable to load screenshots. Please try again.';

// ─── Paginated fetch (all pages up to MAX_PAGES) ──────────────────────────────

interface FetchAllResult {
  photos: ReturnType<typeof mapCameraRollPhoto>[];
}

const fetchAllScreenshots = async (
  existingByUri: Map<string, Screenshot>,
): Promise<FetchAllResult> => {
  const collected: ReturnType<typeof mapCameraRollPhoto>[] = [];
  let cursor: string | undefined;
  let page = 0;

  do {
    const result = await CameraRoll.getPhotos({
      first: PAGE_SIZE,
      after: cursor,
      assetType: 'Photos',
      groupTypes: 'All',
      include: ['filename', 'fileSize', 'imageSize'],
    });

    const mapped = result.edges.map((edge) => mapCameraRollPhoto(edge, existingByUri));
    collected.push(...mapped);

    const {has_next_page, end_cursor} = result.page_info;

    // Stop if no more pages or cursor didn't advance (Android SDK 30 bug guard)
    if (!has_next_page || !end_cursor || end_cursor === cursor) {
      break;
    }

    cursor = end_cursor;
    page++;
  } while (page < MAX_PAGES);

  return {photos: collected};
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useScreenshotStore = create<ScreenshotState>()(
  persist(
    (set, get) => ({
      screenshots: [],
      selectedScreenshots: [],
      isLoading: false,
      error: null,

      // ── loadScreenshots ──────────────────────────────────────────────────

      loadScreenshots: async () => {
        // Prevent concurrent loads
        if (get().isLoading) return;

        set({isLoading: true, error: null});

        try {
          const existingByUri = buildUriMap(get().screenshots);
          const {photos: allPhotos} = await fetchAllScreenshots(existingByUri);

          // Prefer screenshot-named files; fall back to all photos only as last resort
          const screenshotOnly = allPhotos.filter((item :any) =>
            isLikelyScreenshot(item.fileName, item.uri),
          );

          const resolved = screenshotOnly.length > 0 ? screenshotOnly : allPhotos;
          const sorted = [...resolved].sort(byDateDesc);

          // O(1) lookup to clean up stale selected IDs
          const nextIdSet = new Set(sorted.map((s) => s.id));

          set({
            screenshots: sorted,
            isLoading: false,
            error: null,
            selectedScreenshots: get().selectedScreenshots.filter((id) => nextIdSet.has(id)),
          });
        } catch (error: unknown) {
          set({isLoading: false, error: toErrorMessage(error)});
        }
      },

      // ── deleteScreenshot ──────────────────────────────────────────────────

      deleteScreenshot: (id: string) => {
        set((state) => ({
          screenshots: state.screenshots.filter((s) => s.id !== id),
          selectedScreenshots: state.selectedScreenshots.filter((sid) => sid !== id),
        }));
      },

      // ── deleteMultiple ────────────────────────────────────────────────────

      deleteMultiple: (ids: string[]) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        set((state) => ({
          screenshots: state.screenshots.filter((s) => !idSet.has(s.id)),
          selectedScreenshots: state.selectedScreenshots.filter((sid) => !idSet.has(sid)),
        }));
      },

      // ── toggleFavorite ────────────────────────────────────────────────────

      toggleFavorite: (id: string) => {
        set((state) => ({
          screenshots: state.screenshots.map((s) =>
            s.id === id ? {...s, isFavorite: !s.isFavorite} : s,
          ),
        }));
      },

      // ── addTag ────────────────────────────────────────────────────────────

      addTag: (id: string, tag: string) => {
        const normalized = tag.trim().toLowerCase();
        if (!normalized) return;

        set((state) => ({
          screenshots: state.screenshots.map((s) => {
            // Skip if wrong screenshot OR tag already exists (case-insensitive guard)
            if (s.id !== id || s.tags.includes(normalized)) return s;
            return {...s, tags: [...s.tags, normalized]};
          }),
        }));
      },

      // ── removeTag ─────────────────────────────────────────────────────────

      removeTag: (id: string, tag: string) => {
        set((state) => ({
          screenshots: state.screenshots.map((s) =>
            s.id !== id ? s : {...s, tags: s.tags.filter((t) => t !== tag)},
          ),
        }));
      },

      // ── updateNote (NEW) ──────────────────────────────────────────────────

      updateNote: (id: string, note: string) => {
        set((state) => ({
          screenshots: state.screenshots.map((s) =>
            s.id === id ? {...s, note: note.trim() || undefined} : s,
          ),
        }));
      },

      // ── selectScreenshot ──────────────────────────────────────────────────

      selectScreenshot: (id: string) => {
        set((state) => {
          if (state.selectedScreenshots.includes(id)) return state;
          return {selectedScreenshots: [...state.selectedScreenshots, id]};
        });
      },

      // ── deselectScreenshot ────────────────────────────────────────────────

      deselectScreenshot: (id: string) => {
        set((state) => ({
          selectedScreenshots: state.selectedScreenshots.filter((sid) => sid !== id),
        }));
      },

      // ── clearSelection ────────────────────────────────────────────────────

      clearSelection: () => {
        set({selectedScreenshots: []});
      },

      // ── selectAll ─────────────────────────────────────────────────────────

      selectAll: () => {
        set((state) => ({
          selectedScreenshots: state.screenshots.map((s) => s.id),
        }));
      },

      // ── moveToAlbum ───────────────────────────────────────────────────────

      moveToAlbum: (ids: string[], albumId: string) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        set((state) => ({
          screenshots: state.screenshots.map((s) =>
            idSet.has(s.id) ? {...s, albumId} : s,
          ),
        }));
      },

      // ── removeFromAlbum (NEW) ─────────────────────────────────────────────

      removeFromAlbum: (ids: string[]) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        set((state) => ({
          screenshots: state.screenshots.map((s) =>
            idSet.has(s.id) ? {...s, albumId: null} : s,
          ),
        }));
      },

      // ── reorderTags (NEW) ─────────────────────────────────────────────────

      reorderTags: (id: string, newTagOrder: string[]) => {
        set((state) => ({
          screenshots: state.screenshots.map((s) =>
            s.id === id ? {...s, tags: newTagOrder} : s,
          ),
        }));
      },
    }),

    // ── Persist config ──────────────────────────────────────────────────────
    {
      name: 'screenshot-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist user-defined data — NOT isLoading, error, selectedScreenshots
      // Screenshots themselves are re-fetched from CameraRoll on each load,
      // but we persist tags, notes, favorites, albumId so they survive app restarts.
      partialize: (state) => ({
        screenshots: state.screenshots.map((s) => ({
          // Persist only user-enriched fields, not the raw camera data
          id: s.id,
          uri: s.uri,
          fileName: s.fileName,
          fileSize: s.fileSize,
          createdAt: s.createdAt,
          tags: s.tags,
          isFavorite: s.isFavorite,
          albumId: s.albumId,
          note: s.note,
        })),
      }),
    },
  ),
);