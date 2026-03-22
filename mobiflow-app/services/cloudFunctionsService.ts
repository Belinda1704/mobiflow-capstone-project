// Calls Cloud Functions with auth token.
import Constants from 'expo-constants';
import { auth } from '../config/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseExtra = (Constants.expoConfig?.extra?.firebase ?? {}) as { projectId?: string; functionsRegion?: string };
const REGION = firebaseExtra.functionsRegion || 'us-central1';
const PROJECT_ID = firebaseExtra.projectId || 'mobiflow-app';
const BASE_URL = `https://${REGION}-${PROJECT_ID}.cloudfunctions.net`;

export type HealthScoreResponse = {
  score: number;
  label: string;
  message: string;
};

export type ReportSummaryResponse = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  categoryCount: number;
  categories: { name: string; amount: number }[];
  dateRange: string;
};

export type AdminOverviewResponse = {
  totalUsers: number;
  totalTransactions: number;
  transactionsLast7Days: number;
  activeUsersLast7Days: number;
  generatedAt: string;
  adminUserId: string;
};

export type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; error: string };

async function callFunction<T>(
  name: string,
  options: { method?: 'GET' | 'POST'; body?: object; timeoutMs?: number } = {}
): Promise<ApiResult<T>> {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, status: 401, error: 'Not signed in' };
  }
  let idToken: string;
  try {
    idToken = await user.getIdToken(false);
  } catch (e) {
    return { ok: false, status: 401, error: 'Could not get token. Sign out and sign in again, or check your connection.' };
  }
  if (!idToken) {
    return { ok: false, status: 401, error: 'No token. Sign out and sign in again.' };
  }
  const url = `${BASE_URL}/${name}`;
  const timeoutMs = options.timeoutMs ?? 20000;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);
  const init: RequestInit = {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  };
  if (options.body && options.method === 'POST') {
    init.body = JSON.stringify(options.body);
  }
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!res.ok) {
      const err = typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: string }).error)
        : res.statusText || `HTTP ${res.status}`;
      return { ok: false, status: res.status, error: err };
    }
    return { ok: true, data: data as T, status: res.status };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, status: 0, error: 'Request timed out' };
    }
    const message = e instanceof Error ? e.message : 'Network error';
    return { ok: false, status: 0, error: message };
  } finally {
    clearTimeout(tid);
  }
}

export async function fetchHealthScoreFromServer(): Promise<ApiResult<HealthScoreResponse>> {
  return callFunction<HealthScoreResponse>('getHealthScore', { method: 'GET', timeoutMs: 18000 });
}

export async function fetchReportSummaryFromServer(
  dateRange: 'week' | 'month' | 'all' = 'month'
): Promise<ApiResult<ReportSummaryResponse>> {
  return callFunction<ReportSummaryResponse>('getReportSummary', {
    method: 'POST',
    body: { dateRange },
  });
}

export async function fetchAdminOverviewFromServer(): Promise<ApiResult<AdminOverviewResponse>> {
  const user = auth.currentUser;
  if (!user) {
    return { ok: false, status: 401, error: 'Not signed in' };
  }

  try {
    const functionsClient = getFunctions(auth.app, REGION);
    const callable = httpsCallable<void, AdminOverviewResponse>(functionsClient, 'getAdminOverviewCallable');
    const result = await callable();
    return { ok: true, data: result.data, status: 200 };
  } catch (e: any) {
    const message =
      e?.message ||
      e?.details ||
      'Could not load admin dashboard. Please try again.';
    const code = e?.code === 'functions/unauthenticated' ? 401 : e?.code === 'functions/permission-denied' ? 403 : 500;
    return { ok: false, status: code, error: String(message) };
  }
}
