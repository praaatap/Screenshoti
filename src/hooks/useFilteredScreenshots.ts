import {useMemo} from 'react';
import {useFilterStore} from '../store/useFilterStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import type {Screenshot, SortBy} from '../types';

interface UseFilteredScreenshotsOptions {
  source?: Screenshot[];
  searchQuery?: string;
  sortBy?: SortBy;
  activeTag?: string | null;
  favoritesOnly?: boolean;
}

interface UseFilteredScreenshotsResult {
  filteredScreenshots: Screenshot[];
  allTags: string[];
}

const sortScreenshots = (screenshots: Screenshot[], sortBy: SortBy): Screenshot[] => {
  const cloned = [...screenshots];

  switch (sortBy) {
    case 'date_asc':
      return cloned.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case 'size_desc':
      return cloned.sort((a, b) => b.fileSize - a.fileSize);
    case 'name_asc':
      return cloned.sort((a, b) => a.fileName.localeCompare(b.fileName));
    case 'date_desc':
    default:
      return cloned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
};

export const useFilteredScreenshots = (
  options?: UseFilteredScreenshotsOptions,
): UseFilteredScreenshotsResult => {
  const screenshots = useScreenshotStore((state) => state.screenshots);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const sortBy = useFilterStore((state) => state.sortBy);
  const activeTag = useFilterStore((state) => state.activeTag);
  const showFavoritesOnly = useFilterStore((state) => state.showFavoritesOnly);

  const effectiveSource = options?.source ?? screenshots;
  const effectiveQuery = options?.searchQuery ?? searchQuery;
  const effectiveSort = options?.sortBy ?? sortBy;
  const effectiveTag = options?.activeTag ?? activeTag;
  const effectiveFavoritesOnly = options?.favoritesOnly ?? showFavoritesOnly;

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();

    effectiveSource.forEach((screenshot) => {
      screenshot.tags.forEach((tag) => tagSet.add(tag));
    });

    return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
  }, [effectiveSource]);

  const filteredScreenshots = useMemo(() => {
    const query = effectiveQuery.trim().toLocaleLowerCase();

    const filtered = effectiveSource.filter((screenshot) => {
      const matchesQuery =
        query.length === 0 ||
        screenshot.fileName.toLocaleLowerCase().includes(query) ||
        screenshot.tags.some((tag) => tag.toLocaleLowerCase().includes(query));

      const matchesTag = !effectiveTag || screenshot.tags.includes(effectiveTag);
      const matchesFavorites = !effectiveFavoritesOnly || screenshot.isFavorite;

      return matchesQuery && matchesTag && matchesFavorites;
    });

    return sortScreenshots(filtered, effectiveSort);
  }, [effectiveFavoritesOnly, effectiveQuery, effectiveSort, effectiveSource, effectiveTag]);

  return {
    filteredScreenshots,
    allTags,
  };
};
