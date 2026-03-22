import { httpsCallable } from 'firebase/functions';

import type { AdminDateRange, AdminDateRangeSelection } from '../filters/AdminDateRangeContext';
import { auth, functionsClient } from '../firebase/config';

export type AdminOverview = {
  totalUsers: number;
  totalTransactions: number;
  transactionsLast7Days: number;
  activeUsersLast7Days: number;
  financials: {
    incomeTotal: number;
    expenseTotal: number;
    netTotal: number;
  };
  period: {
    key: AdminDateRange;
    label: string;
    days: number;
    newUsers: number;
    transactions: number;
    activeUsers: number;
    lessonCompletions: number;
    openSupportRequests?: number;
  };
  dailyActivity: Array<{
    label: string;
    transactions: number;
    newUsers: number;
    lessonCompletions?: number;
    /** Unique users with a tx that day (chart range). */
    activeUsers?: number;
  }>;
  categoryBreakdown: Array<{
    label: string;
    value: number;
  }>;
  learning: {
    totalLessonCompletions: number;
    uniqueLearners: number;
    lessonCompletionsLast30Days: number;
    topLessons: Array<{
      lessonId: string;
      label: string;
      count: number;
    }>;
    recentCompletions: Array<{
      id: string;
      lessonId: string;
      label: string;
      completedAt: string | null;
    }>;
  };
  adminAccounts: Array<{
    uid: string;
    email: string;
    phone: string;
    disabled: boolean;
    lastSignInTime: string | null;
  }>;
  supportRequests: Array<{
    id: string;
    type: string;
    status: string;
    phone: string;
    source: string;
    createdAt: string | null;
  }>;
  activityFeed: Array<{
    id: string;
    type: 'transaction' | 'lesson' | 'user' | 'support';
    title: string;
    detail: string;
    createdAt: string | null;
  }>;
  generatedAt: string;
  adminUserId: string;
};

type CacheEntry = {
  data: AdminOverview;
  cachedAt: number;
};

// Cache overview 5 min so switching admin pages does not refetch every time.
const OVERVIEW_CACHE_TTL_MS = 300_000;
const overviewCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<AdminOverview>>();

export function getOverviewSelectionKey(selection: AdminDateRangeSelection): string {
  const start = selection.startDate ?? '';
  const end = selection.endDate ?? '';
  return `${selection.dateRange}|${start}|${end}`;
}

// Return cached overview for the same date range if still fresh.
export function peekCachedAdminOverview(selection: AdminDateRangeSelection): AdminOverview | null {
  const key = getOverviewSelectionKey(selection);
  const cached = overviewCache.get(key);
  if (cached && Date.now() - cached.cachedAt < OVERVIEW_CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

export function getDashboardErrorMessage(error: unknown): string {
  const firebaseError = error as {
    message?: string;
    code?: string;
    details?: unknown;
  };

  if (typeof firebaseError?.details === 'string' && firebaseError.details.trim()) {
    return firebaseError.details.trim();
  }

  if (typeof firebaseError?.message === 'string') {
    const message = firebaseError.message.trim();
    if (message && message.toLowerCase() !== 'undefined') {
      return message;
    }
  }

  if (typeof firebaseError?.code === 'string' && firebaseError.code.trim()) {
    return `Could not load dashboard (${firebaseError.code.replace('functions/', '')}).`;
  }

  return 'Could not load dashboard data.';
}

export async function fetchAdminOverview(
  selection: AdminDateRangeSelection,
  options?: { forceRefresh?: boolean }
): Promise<AdminOverview> {
  const key = getOverviewSelectionKey(selection);
  const forceRefresh = options?.forceRefresh === true;
  const now = Date.now();
  const cached = overviewCache.get(key);

  if (!forceRefresh && cached && now - cached.cachedAt < OVERVIEW_CACHE_TTL_MS) {
    return cached.data;
  }

  if (!forceRefresh) {
    const pending = inFlightRequests.get(key);
    if (pending) {
      return pending;
    }
  }

  const requestPromise = (async () => {
  try {
    if (!auth.currentUser) {
      throw new Error('Not signed in. Please sign in again.');
    }
    // Avoid getIdToken(true): it forces a network round-trip every time and adds seconds of delay.
    await auth.currentUser.getIdToken();

    const callable = httpsCallable<AdminDateRangeSelection, AdminOverview>(
      functionsClient,
      'getAdminOverviewCallable'
    );
    const response = await callable(selection);

    if (!response.data) {
      throw new Error('No overview data was returned.');
    }

    overviewCache.set(key, { data: response.data, cachedAt: Date.now() });
    return response.data;
  } catch (error) {
    throw new Error(getDashboardErrorMessage(error));
  }
  })();

  inFlightRequests.set(key, requestPromise);
  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(key);
  }
}

export async function resolveSupportRequest(requestId: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('Not signed in. Please sign in again.');
  }
  await auth.currentUser.getIdToken();
  const callable = httpsCallable<{ requestId: string }, { ok: boolean }>(
    functionsClient,
    'resolveSupportRequestCallable'
  );
  await callable({ requestId });
}
