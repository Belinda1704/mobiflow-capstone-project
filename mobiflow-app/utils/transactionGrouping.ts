/** Groups transactions by day and works out daily totals for the Transactions screen. */
import type { Transaction } from '../types/transaction';
import { toDate } from './formatDate';

export type TransactionDateGroup = {
  dateKey: string;
  label: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  net: number;
};

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getGroupLabel(dateKey: string, t?: (k: string) => string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today) {
    return t ? t('filterToday') : 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return t ? t('yesterday') : 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function groupTransactionsByDate(
  transactions: Transaction[],
  t?: (k: string) => string
): TransactionDateGroup[] {
  const byDate = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    const date = toDate(tx.createdAt);
    const key = getDateKey(date);
    const list = byDate.get(key) ?? [];
    list.push(tx);
    byDate.set(key, list);
  }

  const groups: TransactionDateGroup[] = [];
  const keys = Array.from(byDate.keys()).sort((a, b) => b.localeCompare(a));

  for (const key of keys) {
    const list = (byDate.get(key) ?? []).sort((a, b) => {
      const da = toDate(a.createdAt).getTime();
      const db = toDate(b.createdAt).getTime();
      return db - da;
    });
    const totalIncome = list.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const totalExpense = list.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    groups.push({
      dateKey: key,
      label: getGroupLabel(key, t),
      transactions: list,
      totalIncome,
      totalExpense,
      net: totalIncome - totalExpense,
    });
  }

  return groups;
}
