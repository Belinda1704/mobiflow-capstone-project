import { formatTransactionDate, formatShortDate, toDate } from '../../utils/formatDate';

describe('Date utilities', () => {
  describe('toDate', () => {
    it('returns same Date when given Date', () => {
      const d = new Date('2026-02-18T14:30:00Z');
      expect(toDate(d)).toBe(d);
    });

    it('converts Firestore timestamp via toDate()', () => {
      const d = new Date('2026-02-18T14:30:00Z');
      expect(toDate({ toDate: () => d })).toEqual(d);
    });
  });

  describe('formatShortDate', () => {
    it('formats date as Month Day, Year', () => {
      const d = new Date(2026, 1, 18);
      expect(formatShortDate(d)).toMatch(/Feb.*18.*2026/);
    });
  });

  describe('formatTransactionDate', () => {
    it('returns empty string for null or undefined', () => {
      expect(formatTransactionDate(null)).toBe('');
      expect(formatTransactionDate(undefined)).toBe('');
    });
  });
});
