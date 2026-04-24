import {useMemo} from 'react';
import {useIntelligenceStore} from '../store/useIntelligenceStore';
import {useFilterStore} from '../store/useFilterStore';
import {useScreenshotStore} from '../store/useScreenshotStore';
import type {Screenshot, SortBy} from '../types';
import type {SmartCategory} from '../domain/organization/smartGrouping';

interface UseFilteredScreenshotsOptions {
  source?: Screenshot[];
  searchQuery?: string;
  sortBy?: SortBy;
  activeTag?: string | null;
  favoritesOnly?: boolean;
  smartCategory?: SmartCategory | 'all';
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
  const ocrById = useIntelligenceStore((state) => state.ocrById);
  const insightById = useIntelligenceStore((state) => state.insightById);
  const selectedSmartCategory = useIntelligenceStore((state) => state.selectedSmartCategory);

  const effectiveSource = options?.source ?? screenshots;
  const effectiveQuery = options?.searchQuery ?? searchQuery;
  const effectiveSort = options?.sortBy ?? sortBy;
  const effectiveTag = options?.activeTag ?? activeTag;
  const effectiveFavoritesOnly = options?.favoritesOnly ?? showFavoritesOnly;
  const effectiveSmartCategory = options?.smartCategory ?? selectedSmartCategory;

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
        screenshot.tags.some((tag) => tag.toLocaleLowerCase().includes(query)) ||
        (ocrById[screenshot.id] ?? '').toLocaleLowerCase().includes(query);

      const matchesTag = !effectiveTag || screenshot.tags.includes(effectiveTag);
      const matchesFavorites = !effectiveFavoritesOnly || screenshot.isFavorite;
      const smartCategory = insightById[screenshot.id]?.category;
      const matchesSmartCategory =
        effectiveSmartCategory === 'all' || smartCategory === effectiveSmartCategory;

      return matchesQuery && matchesTag && matchesFavorites && matchesSmartCategory;
    });

    return sortScreenshots(filtered, effectiveSort);
  }, [
    effectiveFavoritesOnly,
    effectiveQuery,
    effectiveSort,
    effectiveSource,
    effectiveSmartCategory,
    effectiveTag,
    insightById,
    ocrById,
  ]);

  return {
    filteredScreenshots,
    allTags,
  };
};

// NEW: Add to the bottom of useFilteredScreenshots.ts

export interface ScreenshotGroup {
  title: string;
  data: Screenshot[];
}

export const useGroupedScreenshots = (
  options?: UseFilteredScreenshotsOptions,
): {groups: ScreenshotGroup[]; allTags: string[]} => {
  const {filteredScreenshots, allTags} = useFilteredScreenshots(options);

  const groups = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const buckets: Record<string, Screenshot[]> = {
      Today: [],
      Yesterday: [],
      'This week': [],
      Older: [],
    };

    filteredScreenshots.forEach((shot) => {
      const d = new Date(shot.createdAt);
      const ds = d.toDateString();
      if (ds === todayStr) buckets['Today'].push(shot);
      else if (ds === yesterdayStr) buckets['Yesterday'].push(shot);
      else if (d >= weekAgo) buckets['This week'].push(shot);
      else buckets['Older'].push(shot);
    });

    return Object.entries(buckets)
      .filter(([, data]) => data.length > 0)
      .map(([title, data]) => ({title, data}));
  }, [filteredScreenshots]);

  return {groups, allTags};
};