import type {NativeStackScreenProps} from '@react-navigation/native-stack';

export interface Screenshot {
  id: string;
  uri: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
  note?: string;
  tags: string[];
  isFavorite: boolean;
  albumId: string | null;
  isPrivate?: boolean;
}

export interface ScreenshotState {
  screenshots: Screenshot[];
  selectedScreenshots: string[];
  isLoading: boolean;
  updateNote: (id: string, note: string) => void;
  error: string | null;
  loadScreenshots: () => Promise<void>;
  deleteScreenshot: (id: string) => void;
  deleteMultiple: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;
  addTag: (id: string, tag: string) => void;
  removeTag: (id: string, tag: string) => void;
  selectScreenshot: (id: string) => void;
  deselectScreenshot: (id: string) => void;
  clearSelection: () => void;
  selectAll: () => void;
  moveToAlbum: (ids: string[], albumId: string) => void;
}

export interface Album {
  id: string;
  name: string;
  coverUri: string | null;
  screenshotCount: number;
  createdAt: string;
}

export interface AlbumState {
  albums: Album[];
  createAlbum: (name: string) => void;
  deleteAlbum: (id: string) => void;
  renameAlbum: (id: string, newName: string) => void;
}

export type SortBy = 'date_desc' | 'date_asc' | 'size_desc' | 'name_asc';

export interface FilterState {
  searchQuery: string;
  sortBy: SortBy;
  activeTag: string | null;
  showFavoritesOnly: boolean;
  setSearchQuery: (q: string) => void;
  setSortBy: (sort: FilterState['sortBy']) => void;
  setActiveTag: (tag: string | null) => void;
  toggleFavoritesOnly: () => void;
  resetFilters: () => void;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  border: string;
  outline: string;
  outlineVariant: string;
  muted: string;
  danger: string;
  dangerContainer: string;
  success: string;
  successContainer: string;
  warning: string;
  warningContainer: string;
  scrim: string;
}

export interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
}

export interface ThemeState {
  isDarkMode: boolean;
  autoDeleteDuplicates: boolean;
  cacheVersion: number;
  theme: AppTheme;
  toggleDarkMode: () => void;
  toggleAutoDeleteDuplicates: () => void;
  clearCache: () => Promise<void>;
}

export type RootStackParamList = {
  Main: undefined;
  Detail: {screenshotId: string};
  AlbumDetail: {albumId: string; albumName: string};
  Search: undefined;
};

export type BottomTabParamList = {
  HomeTab: undefined;
  AlbumsTab: undefined;
  FavoritesTab: undefined;
  SettingsTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type AlbumsStackParamList = {
  Albums: undefined;
};

export type FavoritesStackParamList = {
  Favorites: undefined;
};

export type SettingsStackParamList = {
  Settings: undefined;
};

export type RootScreenProps<RouteName extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  RouteName
>;

export type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, 'Home'>;
export type AlbumsScreenProps = NativeStackScreenProps<AlbumsStackParamList, 'Albums'>;
export type FavoritesScreenProps = NativeStackScreenProps<FavoritesStackParamList, 'Favorites'>;
export type SettingsScreenProps = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;
export type SearchScreenProps = NativeStackScreenProps<RootStackParamList, 'Search'>;
export type DetailScreenProps = NativeStackScreenProps<RootStackParamList, 'Detail'>;
export type AlbumDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'AlbumDetail'>;

export const APP_VERSION = '0.0.1';
