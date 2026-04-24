import {buildSmartInsights, categorizeScreenshot} from '../../src/domain/organization/smartGrouping';

describe('smart grouping', () => {
  const shots = [
    {
      id: '1',
      uri: 'file://1',
      fileName: 'invoice_2999.png',
      fileSize: 12345,
      createdAt: '2026-01-01T00:00:00.000Z',
      tags: [],
      isFavorite: false,
      albumId: null,
    },
    {
      id: '2',
      uri: 'file://2',
      fileName: 'invoice_2999.png',
      fileSize: 12345,
      createdAt: '2026-01-01T00:00:00.000Z',
      tags: [],
      isFavorite: false,
      albumId: null,
    },
  ];

  it('categorizes shopping and receipts from text', () => {
    expect(categorizeScreenshot('receipt order total paid')).toBe('receipt');
    expect(categorizeScreenshot('discount $29 checkout')).toBe('shopping');
  });

  it('detects duplicate groups', () => {
    const insights = buildSmartInsights(shots, {
      '1': 'invoice paid',
      '2': 'invoice paid',
    });

    expect(insights['1'].duplicateGroupId).toBeTruthy();
    expect(insights['2'].duplicateGroupId).toBeTruthy();
  });
});
