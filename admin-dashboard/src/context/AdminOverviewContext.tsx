import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAdminAuth } from '../auth/AdminAuthContext';
import { useAdminDateRange } from '../filters/AdminDateRangeContext';
import {
  fetchAdminOverview,
  getOverviewSelectionKey,
  peekCachedAdminOverview,
  type AdminOverview,
} from '../services/adminService';

type AdminOverviewContextValue = {
  overview: AdminOverview | null;
  /** First load with no data yet */
  loading: boolean;
  /** Fetch running but old overview still shown */
  isRefreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const AdminOverviewContext = createContext<AdminOverviewContextValue | null>(null);

export function AdminOverviewProvider({ children }: { children: ReactNode }) {
  const { isAdmin } = useAdminAuth();
  const { dateRange, startDate, endDate } = useAdminDateRange();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Date filter key for the current overview (null = not loaded) */
  const loadedKeyRef = useRef<string | null>(null);

  const selection = useMemo(
    () => ({ dateRange, startDate, endDate }),
    [dateRange, startDate, endDate]
  );

  useEffect(() => {
    if (!isAdmin) {
      setOverview(null);
      setFetching(false);
      setError(null);
      loadedKeyRef.current = null;
      return;
    }

    const key = getOverviewSelectionKey(selection);
    const cached = peekCachedAdminOverview(selection);

    if (cached) {
      setOverview(cached);
      loadedKeyRef.current = key;
    } else if (loadedKeyRef.current !== null && loadedKeyRef.current !== key) {
      setOverview(null);
    }

    setError(null);
    setFetching(true);

    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchAdminOverview(selection);
        if (!cancelled) {
          setOverview(data);
          loadedKeyRef.current = key;
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error && err.message.trim() && err.message.toLowerCase() !== 'undefined'
              ? err.message
              : 'Could not load dashboard data.';
          setError(message);
          if (!cached) {
            setOverview(null);
            loadedKeyRef.current = null;
          }
        }
      } finally {
        if (!cancelled) {
          setFetching(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, selection]);

  const refresh = useCallback(async () => {
    if (!isAdmin) return;
    setFetching(true);
    setError(null);
    try {
      const data = await fetchAdminOverview(selection, { forceRefresh: true });
      setOverview(data);
      loadedKeyRef.current = getOverviewSelectionKey(selection);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim() && err.message.toLowerCase() !== 'undefined'
          ? err.message
          : 'Could not load dashboard data.';
      setError(message);
    } finally {
      setFetching(false);
    }
  }, [isAdmin, selection]);

  const loading = fetching && !overview;
  const isRefreshing = fetching && !!overview;

  const value = useMemo(
    () => ({ overview, loading, isRefreshing, error, refresh }),
    [overview, loading, isRefreshing, error, refresh]
  );

  return <AdminOverviewContext.Provider value={value}>{children}</AdminOverviewContext.Provider>;
}

export function useAdminOverviewContext(): AdminOverviewContextValue {
  const ctx = useContext(AdminOverviewContext);
  if (!ctx) {
    throw new Error('useAdminOverviewContext must be used within AdminOverviewProvider');
  }
  return ctx;
}
