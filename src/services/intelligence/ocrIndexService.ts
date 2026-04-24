import type {Screenshot} from '../../types';

const tokenizeFileName = (fileName: string): string =>
  fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const maybeAmount = (fileName: string): string => {
  const amountMatch = fileName.match(/(?:rs|inr|usd|\$|₹)[\s-]*([0-9]+(?:\.[0-9]{1,2})?)/i);
  return amountMatch ? `amount ${amountMatch[1]}` : '';
};

export const extractIndexableText = (screenshot: Screenshot): string => {
  const fromName = tokenizeFileName(screenshot.fileName);
  const amountHint = maybeAmount(screenshot.fileName);
  const fromTags = screenshot.tags.join(' ');
  const fromNote = screenshot.note ?? '';

  return [fromName, fromTags, fromNote, amountHint]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
};

export const buildOcrIndex = (screenshots: Screenshot[]): Record<string, string> => {
  const index: Record<string, string> = {};

  screenshots.forEach((shot) => {
    index[shot.id] = extractIndexableText(shot);
  });

  return index;
};
