import type {Screenshot} from '../../types';

export interface OcrResult {
  screenshotId: string;
  text: string;
  confidence: number;
}

export interface LocalOcrModel {
  initialize: () => Promise<void>;
  extractText: (screenshot: Screenshot) => Promise<OcrResult>;
}

// Heuristic fallback model that works offline without native deps.
// Replace with a native adapter (ML Kit/Tesseract) for production OCR quality.
export class HeuristicLocalOcrModel implements LocalOcrModel {
  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  async extractText(screenshot: Screenshot): Promise<OcrResult> {
    const text = [
      screenshot.fileName,
      screenshot.tags.join(' '),
      screenshot.note ?? '',
    ]
      .join(' ')
      .replace(/[_-]+/g, ' ')
      .trim();

    return {
      screenshotId: screenshot.id,
      text,
      confidence: 0.35,
    };
  }
}
