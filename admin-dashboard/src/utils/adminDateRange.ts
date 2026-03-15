import type { AdminDateRange } from '../filters/AdminDateRangeContext';

export function getAdminDateRangeLabel(
  dateRange: AdminDateRange,
  startDate?: string,
  endDate?: string
): string {
  if (dateRange === 'all') return 'All activity';
  if (dateRange === '7d') return 'Last 7 days';
  if (dateRange === '90d') return 'Last 90 days';
  if (dateRange === 'custom' && startDate && endDate) {
    return `${startDate} to ${endDate}`;
  }
  return 'Last 30 days';
}
