import {create} from 'zustand';
import type {FilterState} from '../types';

const initialState = {
  searchQuery: '',
  sortBy: 'date_desc' as const,
  activeTag: null,
  showFavoritesOnly: false,
};

export const useFilterStore = create<FilterState>()((set) => ({
  ...initialState,

  setSearchQuery: (q: string) => {
    set({searchQuery: q});
  },

  setSortBy: (sort: FilterState['sortBy']) => {
    set({sortBy: sort});
  },

  setActiveTag: (tag: string | null) => {
    set({activeTag: tag});
  },

  toggleFavoritesOnly: () => {
    set((state) => ({showFavoritesOnly: !state.showFavoritesOnly}));
  },

  resetFilters: () => {
    set(initialState);
  },
}));
