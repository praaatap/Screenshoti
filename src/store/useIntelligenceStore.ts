import {create} from 'zustand';
import type {Screenshot} from '../types';
import {buildOcrIndex} from '../services/intelligence/ocrIndexService';
import {buildSmartInsights, type SmartCategory} from '../domain/organization/smartGrouping';
import {runAutomationRules} from '../domain/automation/rules';

interface InsightEntry {
  category: SmartCategory;
  duplicateGroupId: string | null;
  similarIds: string[];
}

interface IntelligenceState {
  ocrById: Record<string, string>;
  insightById: Record<string, InsightEntry>;
  recentQueries: string[];
  selectedSmartCategory: SmartCategory | 'all';
  reindex: (screenshots: Screenshot[]) => void;
  setSelectedSmartCategory: (category: SmartCategory | 'all') => void;
  saveQuery: (query: string) => void;
  getExtractedText: (ids: string[]) => string;
}

export const useIntelligenceStore = create<IntelligenceState>()((set, get) => ({
  ocrById: {},
  insightById: {},
  recentQueries: [],
  selectedSmartCategory: 'all',

  reindex: (screenshots: Screenshot[]) => {
    const ocrById = buildOcrIndex(screenshots);
    const baseInsights = buildSmartInsights(screenshots, ocrById);
    const automationCategoryById = runAutomationRules(ocrById);

    const insightById: Record<string, InsightEntry> = {};

    Object.entries(baseInsights).forEach(([id, base]) => {
      insightById[id] = {
        ...base,
        category: automationCategoryById[id] ?? base.category,
      };
    });

    set({ocrById, insightById});
  },

  setSelectedSmartCategory: (category) => {
    set({selectedSmartCategory: category});
  },

  saveQuery: (query: string) => {
    const normalized = query.trim();
    if (!normalized) {
      return;
    }

    const recent = get().recentQueries.filter((item) => item !== normalized);
    set({recentQueries: [normalized, ...recent].slice(0, 8)});
  },

  getExtractedText: (ids: string[]) => {
    const lookup = get().ocrById;
    return ids
      .map((id) => lookup[id])
      .filter(Boolean)
      .join('\n\n');
  },
}));
