import { describe, it, expect } from 'vitest';
import { getAdminDateRangeLabel } from '../../utils/adminDateRange';

describe('getAdminDateRangeLabel', () => {
  it('returns "All activity" for dateRange "all"', () => {
    expect(getAdminDateRangeLabel('all')).toBe('All activity');
  });

  it('returns "Last 7 days" for dateRange "7d"', () => {
    expect(getAdminDateRangeLabel('7d')).toBe('Last 7 days');
  });

  it('returns "Last 30 days" for dateRange "30d"', () => {
    expect(getAdminDateRangeLabel('30d')).toBe('Last 30 days');
  });

  it('returns "Last 90 days" for dateRange "90d"', () => {
    expect(getAdminDateRangeLabel('90d')).toBe('Last 90 days');
  });

  it('returns custom range string when dateRange is "custom" and start/end provided', () => {
    expect(
      getAdminDateRangeLabel('custom', '2025-01-01', '2025-01-15')
    ).toBe('2025-01-01 to 2025-01-15');
  });

  it('returns "Last 30 days" for "custom" without both start and end', () => {
    expect(getAdminDateRangeLabel('custom')).toBe('Last 30 days');
    expect(getAdminDateRangeLabel('custom', '2025-01-01')).toBe('Last 30 days');
    expect(getAdminDateRangeLabel('custom', undefined, '2025-01-15')).toBe('Last 30 days');
  });
});
