import { httpsCallable } from 'firebase/functions';

import type { AdminDateRange, AdminDateRangeSelection } from '../filters/AdminDateRangeContext';
import { functionsClient } from '../firebase/config';

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
      phone: string;
      completedAt: string | null;
    }>;
  };
  recentActivity: Array<{
    id: string;
    userId: string;
    phone: string;
    label: string;
    amount: number;
    type: string;
    category: string;
    createdAt: string | null;
  }>;
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

export async function fetchAdminOverview(selection: AdminDateRangeSelection): Promise<AdminOverview> {
  try {
    const callable = httpsCallable<AdminDateRangeSelection, AdminOverview>(
      functionsClient,
      'getAdminOverviewCallable'
    );
    const response = await callable(selection);

    if (!response.data) {
      throw new Error('No overview data was returned.');
    }

    return response.data;
  } catch (error) {
    throw new Error(getDashboardErrorMessage(error));
  }
}
