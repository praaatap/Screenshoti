import {buildOcrIndex, extractIndexableText} from '../../src/services/intelligence/ocrIndexService';

describe('ocr index service', () => {
  const shot = {
    id: 'id-1',
    uri: 'file://shot',
    fileName: 'Order_USD_1299.png',
    fileSize: 100,
    createdAt: '2026-01-01T00:00:00.000Z',
    note: 'Purchased for office',
    tags: ['shopping'],
    isFavorite: false,
    albumId: null,
  };

  it('builds searchable text from filename tags note', () => {
    const text = extractIndexableText(shot);

    expect(text.toLowerCase()).toContain('order usd 1299');
    expect(text.toLowerCase()).toContain('shopping');
    expect(text.toLowerCase()).toContain('purchased for office');
  });

  it('indexes by screenshot id', () => {
    const index = buildOcrIndex([shot]);

    expect(index['id-1']).toBeTruthy();
  });
});
