import type {Screenshot} from '../../types';

export type SmartCategory =
  | 'receipt'
  | 'code'
  | 'design'
  | 'shopping'
  | 'docs'
  | 'social'
  | 'uncategorized';

export interface SmartInsight {
  category: SmartCategory;
  duplicateGroupId: string | null;
  similarIds: string[];
}

const KEYWORDS: Record<SmartCategory, string[]> = {
  receipt: ['receipt', 'invoice', 'tax', 'total', 'paid', 'order id'],
  code: ['function', 'const', 'import', 'typescript', 'error', 'stacktrace', 'api'],
  design: ['figma', 'dribbble', 'palette', 'typography', 'component', 'layout'],
  shopping: ['buy', 'price', 'discount', 'sale', 'offer', '$', 'usd', 'inr'],
  docs: ['pdf', 'policy', 'agreement', 'terms', 'document', 'resume'],
  social: ['instagram', 'whatsapp', 'twitter', 'x.com', 'reel', 'post'],
  uncategorized: [],
};

const normalize = (value: string): string => value.trim().toLocaleLowerCase();

const fileBase = (name: string): string => {
  const withoutExt = name.replace(/\.[a-z0-9]+$/i, '');
  return withoutExt.replace(/[^a-z0-9]/gi, '').toLocaleLowerCase();
};

export const categorizeScreenshot = (searchableText: string): SmartCategory => {
  const corpus = normalize(searchableText);

  const ordered: SmartCategory[] = ['receipt', 'shopping', 'code', 'design', 'docs', 'social'];

  for (const category of ordered) {
    if (KEYWORDS[category].some((word) => corpus.includes(word))) {
      return category;
    }
  }

  return 'uncategorized';
};

export const buildSmartInsights = (
  screenshots: Screenshot[],
  ocrById: Record<string, string>,
): Record<string, SmartInsight> => {
  const duplicateMap = new Map<string, string[]>();
  const baseMap = new Map<string, string[]>();

  screenshots.forEach((shot) => {
    const duplicateKey = `${fileBase(shot.fileName)}|${shot.fileSize}`;
    const baseKey = fileBase(shot.fileName).slice(0, 12);

    duplicateMap.set(duplicateKey, [...(duplicateMap.get(duplicateKey) ?? []), shot.id]);

    if (baseKey.length > 0) {
      baseMap.set(baseKey, [...(baseMap.get(baseKey) ?? []), shot.id]);
    }
  });

  const insights: Record<string, SmartInsight> = {};

  screenshots.forEach((shot) => {
    const raw = [shot.fileName, shot.note ?? '', shot.tags.join(' '), ocrById[shot.id] ?? ''].join(' ');
    const category = categorizeScreenshot(raw);

    const dupKey = `${fileBase(shot.fileName)}|${shot.fileSize}`;
    const dupGroup = duplicateMap.get(dupKey) ?? [];
    const duplicateGroupId = dupGroup.length > 1 ? `dup-${dupKey}` : null;

    const simKey = fileBase(shot.fileName).slice(0, 12);
    const similar = (baseMap.get(simKey) ?? []).filter((id) => id !== shot.id).slice(0, 8);

    insights[shot.id] = {
      category,
      duplicateGroupId,
      similarIds: similar,
    };
  });

  return insights;
};
