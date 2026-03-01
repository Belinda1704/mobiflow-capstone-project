import type { Transaction } from '../types/transaction';

/** Get a Date from the transaction’s createdAt (handles Firestore timestamp or Date). Returns null if missing. */
export function getTransactionDate(t: Transaction): Date | null {
  const raw = t.createdAt;
  if (!raw) return null;
  if (raw instanceof Date) return raw;
  if (typeof (raw as { toDate?: () => Date }).toDate === 'function') {
    return (raw as { toDate: () => Date }).toDate();
  }
  const sec = (raw as { seconds?: number }).seconds;
  return sec != null ? new Date(sec * 1000) : null;
}
