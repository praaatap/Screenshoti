import Share from 'react-native-share';
import {Platform} from 'react-native';
import {trackEvent} from '../observability/analytics';
import {formatBytes, formatDateTime} from '../../utils/formatters';
import type {Screenshot} from '../../types';

const APP_DEEP_LINK_BASE = 'https://app.screenshoti.app';

export const shareScreenshot = async (screenshot: Screenshot): Promise<void> => {
  await Share.open({
    url: screenshot.uri,
    title: screenshot.fileName,
    message: `Shared from Screenshoti`,
    failOnCancel: false,
  });
  trackEvent('share_single', {id: screenshot.id});
};

export const shareMultipleScreenshots = async (screenshots: Screenshot[]): Promise<void> => {
  if (screenshots.length === 0) return;
  if (screenshots.length === 1) {
    return shareScreenshot(screenshots[0]);
  }
  await Share.open({
    urls: screenshots.map((s) => s.uri),
    title: `${screenshots.length} screenshots from Screenshoti`,
    failOnCancel: false,
  });
  trackEvent('share_multiple', {count: screenshots.length});
};

export const shareScreenshotAsText = async (screenshot: Screenshot, extractedText?: string): Promise<void> => {
  const lines = [
    `📸 ${screenshot.fileName}`,
    `📅 ${formatDateTime(screenshot.createdAt)}`,
    `📦 ${formatBytes(screenshot.fileSize)}`,
  ];
  if (screenshot.tags.length > 0) {
    lines.push(`🏷️ ${screenshot.tags.join(', ')}`);
  }
  if (screenshot.note) {
    lines.push(`📝 ${screenshot.note}`);
  }
  if (extractedText) {
    lines.push('', '--- Extracted Text ---', extractedText);
  }
  lines.push('', `🔗 View: ${APP_DEEP_LINK_BASE}/screenshot/${encodeURIComponent(screenshot.id)}`);

  await Share.open({
    title: `Screenshot: ${screenshot.fileName}`,
    message: lines.join('\n'),
    failOnCancel: false,
  });
  trackEvent('share_as_text', {id: screenshot.id});
};

export const shareDeepLink = async (type: 'screenshot' | 'album', id: string, label?: string): Promise<void> => {
  const url =
    type === 'screenshot'
      ? `${APP_DEEP_LINK_BASE}/screenshot/${encodeURIComponent(id)}`
      : `${APP_DEEP_LINK_BASE}/album/${encodeURIComponent(id)}/${encodeURIComponent(label ?? '')}`;

  const nativeUrl =
    type === 'screenshot'
      ? `screenshoti://screenshot/${encodeURIComponent(id)}`
      : `screenshoti://album/${encodeURIComponent(id)}/${encodeURIComponent(label ?? '')}`;

  await Share.open({
    title: label ?? 'Screenshoti',
    message: Platform.OS === 'android' ? `${label ?? 'Open in Screenshoti'}\n${nativeUrl}` : url,
    url,
    failOnCancel: false,
  });
  trackEvent('share_deep_link', {type, id});
};

export const shareAlbum = async (albumId: string, albumName: string, screenshots: Screenshot[]): Promise<void> => {
  if (screenshots.length === 0) {
    return shareDeepLink('album', albumId, albumName);
  }
  const coverUri = screenshots[0].uri;
  await Share.open({
    url: coverUri,
    title: `Album: ${albumName}`,
    message: `${albumName} — ${screenshots.length} screenshots\n${APP_DEEP_LINK_BASE}/album/${encodeURIComponent(albumId)}/${encodeURIComponent(albumName)}`,
    failOnCancel: false,
  });
  trackEvent('share_album', {albumId, count: screenshots.length});
};
