import type { PhotoIdentifier } from '@react-native-camera-roll/camera-roll';
import type { Screenshot } from '../types';

const SCREENSHOT_PATTERN =
  /(screenshot|screen[ _-]?shot|screen_capture|截屏|스크린샷|スクリーンショット)/i;

const toIsoDate = (timestamp: number | undefined): string => {
  if (!timestamp || Number.isNaN(timestamp)) {
    return new Date().toISOString();
  }

  const timestampMs = timestamp > 10_000_000_000 ? timestamp : timestamp * 1000;
  return new Date(timestampMs).toISOString();
};

const getFallbackName = (uri: string, createdAt: string): string => {
  const extracted = uri.split('/').pop();

  if (extracted && extracted.trim().length > 0) {
    return extracted;
  }

  return `screenshot-${createdAt}`;
};

export const isLikelyScreenshot = (fileName: string, uri: any): boolean =>
  SCREENSHOT_PATTERN.test(fileName);

export const mapCameraRollPhoto = (
  edge: PhotoIdentifier,
  existingByUri: Map<string, Screenshot>,
): Screenshot => {
  const node = edge.node;
  const image = node.image;
  const uri = image.uri;
  const createdAt = toIsoDate(node.timestamp);
  const fallbackName = getFallbackName(uri, createdAt);
  const fileName = image.filename ?? fallbackName;
  const existing = existingByUri.get(uri);

  return {
    id: uri,
    uri,
    fileName,
    fileSize: image.fileSize ?? 0,
    createdAt,
    tags: existing?.tags ?? [],
    isFavorite: existing?.isFavorite ?? false,
    albumId: existing?.albumId ?? null,
  };
};
