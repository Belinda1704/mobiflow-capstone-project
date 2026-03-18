import { describe, it, expect } from 'vitest';
import { getDashboardErrorMessage } from '../../services/adminService';

describe('getDashboardErrorMessage', () => {
  describe('When details or message is present', () => {
    it('returns details string when present', () => {
      expect(
        getDashboardErrorMessage({ details: ' Permission denied. ' })
      ).toBe('Permission denied.');
    });
    it('returns message when present and not "undefined"', () => {
      expect(
        getDashboardErrorMessage({ message: ' Network error ' })
      ).toBe('Network error');
    });
    it('returns code-based message when only code is present', () => {
      expect(
        getDashboardErrorMessage({ code: 'functions/unavailable' })
      ).toBe('Could not load dashboard (unavailable).');
    });
  });

  describe('Fallback', () => {
    it('returns generic message for empty or undefined-like message', () => {
      expect(getDashboardErrorMessage({ message: 'undefined' })).toBe(
        'Could not load dashboard data.'
      );
      expect(getDashboardErrorMessage({ message: '' })).toBe(
        'Could not load dashboard data.'
      );
    });
    it('returns generic message for unknown error shape', () => {
      expect(getDashboardErrorMessage(null)).toBe('Could not load dashboard data.');
      expect(getDashboardErrorMessage(undefined)).toBe('Could not load dashboard data.');
    });
  });
});
