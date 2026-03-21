import { useCallback, useEffect, useState } from 'react';

import { fetchAdminOverview, type AdminOverview } from '../services/adminService';
import { useAdminAuth } from '../auth/AdminAuthContext';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';

export function useAdminOverview() {
  const { isAdmin } = useAdminAuth();
  const { dateRange, startDate, endDate } = useAdminDateRange();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) {
      setOverview(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchAdminOverview({ dateRange, startDate, endDate });
      setOverview(data);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim() && error.message.toLowerCase() !== 'undefined'
          ? error.message
          : 'Could not load dashboard data.';

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, endDate, isAdmin, startDate]);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAdminOverview({ dateRange, startDate, endDate }, { forceRefresh: true });
      setOverview(data);
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim() && error.message.toLowerCase() !== 'undefined'
          ? error.message
          : 'Could not load dashboard data.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dateRange, endDate, isAdmin, startDate]);

  return { overview, loading, error, refresh };
}
