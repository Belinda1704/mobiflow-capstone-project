import { formatRWF, formatRWFWithSign } from '../../utils/formatCurrency';

describe('formatRWF', () => {
  describe('Positive amounts and zero', () => {
    it('formats positive amount with commas as thousands separator', () => {
      expect(formatRWF(50000)).toBe('50,000 RWF');
      expect(formatRWF(1000000)).toBe('1,000,000 RWF');
    });

    it('formats zero', () => {
      expect(formatRWF(0)).toBe('0 RWF');
    });
  });

  describe('Compact option', () => {
    it('formats 1000+ as K when compact is true', () => {
      expect(formatRWF(5000, { compact: true })).toBe('5K RWF');
    });
  });
});

describe('formatRWFWithSign', () => {
  describe('Sign prefix', () => {
    it('prepends + for positive amount', () => {
      expect(formatRWFWithSign(10000)).toBe('+10,000 RWF');
    });

    it('prepends - for negative amount', () => {
      expect(formatRWFWithSign(-5000)).toBe('-5,000 RWF');
    });
  });
});
