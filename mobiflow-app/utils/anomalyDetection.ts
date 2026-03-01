// Flags unusual amount: > 2x user's average for same type (income/expense) in last 30 days.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from './transactionDate';

const DEFAULT_WINDOW_DAYS = 30;
const UNUSUAL_MULTIPLIER = 2;

export function isUnusualAmount(
  transactions: Transaction[],
  amount: number,
  type: 'income' | 'expense',
  windowDays: number = DEFAULT_WINDOW_DAYS
): boolean {
  const absAmount = Math.abs(amount);
  if (absAmount === 0) return false;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);

  const sameType = transactions.filter((t) => {
    const d = getTransactionDate(t);
    if (!d || d < cutoff) return false;
    if (type === 'income') return t.amount > 0;
    return t.amount < 0;
  });

  if (sameType.length < 3) return false;

  const total = sameType.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const avg = total / sameType.length;
  if (avg <= 0) return false;

  return absAmount > UNUSUAL_MULTIPLIER * avg;
}
