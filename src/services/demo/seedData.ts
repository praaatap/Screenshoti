import type {Screenshot} from '../../types';

const DEMO_ALBUM_IDS = ['work', 'personal', 'inspiration', null, null, null];

const DEMO_ENTRIES: Array<{
  fileName: string;
  tags: string[];
  note?: string;
  isFavorite: boolean;
  albumId: string | null;
}> = [
  {fileName: 'Screenshot_20240115_091234.png', tags: ['ui', 'design'], note: 'Clean onboarding flow idea', isFavorite: true, albumId: 'inspiration'},
  {fileName: 'Screenshot_20240117_143022.png', tags: ['work', 'figma'], isFavorite: false, albumId: 'work'},
  {fileName: 'Screenshot_20240118_080512.png', tags: ['travel', 'maps'], isFavorite: true, albumId: 'personal'},
  {fileName: 'Screenshot_20240120_172345.png', tags: ['recipe', 'food'], isFavorite: false, albumId: null},
  {fileName: 'Screenshot_20240122_094811.png', tags: ['design', 'typography'], note: 'Nice font pairing', isFavorite: true, albumId: 'inspiration'},
  {fileName: 'Screenshot_20240124_163200.png', tags: ['work', 'slack'], isFavorite: false, albumId: 'work'},
  {fileName: 'Screenshot_20240126_114455.png', tags: ['finance', 'budget'], isFavorite: false, albumId: null},
  {fileName: 'Screenshot_20240128_201311.png', tags: ['reading', 'article'], note: 'Good read on product design', isFavorite: true, albumId: 'personal'},
  {fileName: 'Screenshot_20240130_093020.png', tags: ['code', 'reference'], isFavorite: false, albumId: 'work'},
  {fileName: 'Screenshot_20240201_181245.png', tags: ['ui', 'dark-mode'], note: 'Reference for dark UI', isFavorite: true, albumId: 'inspiration'},
  {fileName: 'Screenshot_20240203_120043.png', tags: ['shopping', 'wishlist'], isFavorite: false, albumId: null},
  {fileName: 'Screenshot_20240205_145532.png', tags: ['work', 'email'], isFavorite: false, albumId: 'work'},
  {fileName: 'Screenshot_20240207_091800.png', tags: ['health', 'workout'], isFavorite: true, albumId: 'personal'},
  {fileName: 'Screenshot_20240209_174021.png', tags: ['music', 'playlist'], isFavorite: false, albumId: null},
  {fileName: 'Screenshot_20240211_104512.png', tags: ['design', 'color'], note: 'Monochrome palette inspo', isFavorite: true, albumId: 'inspiration'},
  {fileName: 'Screenshot_20240213_152300.png', tags: ['code', 'typescript'], isFavorite: false, albumId: 'work'},
  {fileName: 'Screenshot_20240215_083411.png', tags: ['travel', 'booking'], isFavorite: false, albumId: 'personal'},
  {fileName: 'Screenshot_20240217_191234.png', tags: ['reading', 'quote'], note: 'Bookmark this', isFavorite: true, albumId: null},
  {fileName: 'Screenshot_20240219_113045.png', tags: ['ui', 'navigation'], isFavorite: false, albumId: 'inspiration'},
  {fileName: 'Screenshot_20240221_165023.png', tags: ['work', 'meeting'], isFavorite: false, albumId: 'work'},
  {fileName: 'Screenshot_20240223_094312.png', tags: ['food', 'restaurant'], isFavorite: true, albumId: 'personal'},
  {fileName: 'Screenshot_20240225_141100.png', tags: ['shopping', 'deal'], isFavorite: false, albumId: null},
  {fileName: 'Screenshot_20240227_172244.png', tags: ['design', 'layout'], note: 'Card layout reference', isFavorite: true, albumId: 'inspiration'},
  {fileName: 'Screenshot_20240229_080034.png', tags: ['code', 'snippet'], isFavorite: false, albumId: 'work'},
];

const parseDate = (fileName: string): string => {
  const match = fileName.match(/(\d{8})_(\d{6})/);
  if (match) {
    const d = match[1];
    const t = match[2];
    return new Date(
      `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${t.slice(0, 2)}:${t.slice(2, 4)}:${t.slice(4, 6)}`,
    ).toISOString();
  }
  return new Date().toISOString();
};

export const buildDemoScreenshots = (count: number): Screenshot[] =>
  DEMO_ENTRIES.slice(0, Math.min(count, DEMO_ENTRIES.length)).map((entry, index) => ({
    id: `demo-${index}-${entry.fileName}`,
    uri: `https://picsum.photos/seed/${index + 1}/390/844`,
    fileName: entry.fileName,
    fileSize: 180_000 + index * 12_000,
    createdAt: parseDate(entry.fileName),
    tags: entry.tags,
    note: entry.note,
    isFavorite: entry.isFavorite,
    albumId: entry.albumId,
  }));

export const buildDemoAlbums = () => [
  {id: 'work', name: 'Work', coverUri: null, screenshotCount: 0, createdAt: new Date('2024-01-01').toISOString()},
  {id: 'personal', name: 'Personal', coverUri: null, screenshotCount: 0, createdAt: new Date('2024-01-01').toISOString()},
  {id: 'inspiration', name: 'Inspiration', coverUri: null, screenshotCount: 0, createdAt: new Date('2024-01-01').toISOString()},
];
