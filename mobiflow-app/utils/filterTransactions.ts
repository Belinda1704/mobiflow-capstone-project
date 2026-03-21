// Filters the transaction list by type, date range, category, payment method, and search text.
import type {
  Transaction,
  FilterTab,
  DateRangeFilter,
  PaymentFilter,
  TransactionFilters,
} from '../types/transaction';
import { getTransactionDate } from './transactionDate';

function isInDateRange(
  date: Date | null,
  range: DateRangeFilter,
  customStart?: Date,
  customEnd?: Date
): boolean {
  if (!date) return false;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

  if (range === 'custom' && customStart && customEnd) {
    const start = new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate());
    const end = new Date(customEnd.getFullYear(), customEnd.getMonth(), customEnd.getDate(), 23, 59, 59);
    return date >= start && date <= end;
  }

  switch (range) {
    case 'all':
      return true;
    case 'today':
      return date >= todayStart && date < todayEnd;
    case 'week': {
      // This week = Monday 00:00 through end of today (so on Sunday you see Mon–Sun, not just Sunday).
      const daysSinceMonday = (now.getDay() + 6) % 7;
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - daysSinceMonday);
      return date >= weekStart && date <= todayEnd;
    }
    case 'last7days': {
      const sevenDaysAgo = new Date(todayStart);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return date >= sevenDaysAgo && date <= todayEnd;
    }
    case 'month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= monthStart && date < todayEnd;
    }
    case '30days': {
      const thirtyDaysAgo = new Date(todayStart);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo && date < todayEnd;
    }
    default:
      return true;
  }
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  const { type, dateRange, customStartDate, customEndDate, category, paymentMethod, search } = filters;
  const searchTerm = search.trim().toLowerCase();

  return transactions.filter((t) => {
    const matchesType = type === 'all' || t.type === type;
    const txDate = getTransactionDate(t);
    const matchesDate = isInDateRange(txDate, dateRange, customStartDate, customEndDate);
    const matchesCategory = !category || t.category === category;
    const pm = t.paymentMethod ?? 'mobile_money';
    const matchesPayment = paymentMethod === 'all' || pm === paymentMethod;

    let matchesSearch = true;
    if (searchTerm) {
      const displayLabel = (t.displayLabel ?? t.label).toLowerCase();
      const labelMatch = displayLabel.includes(searchTerm);
      const categoryMatch = t.category.toLowerCase().includes(searchTerm);
      const digitsOnly = searchTerm.replace(/\D/g, '');
      const amountMatch = digitsOnly
        ? Math.abs(t.amount).toString().includes(digitsOnly)
        : false;
      matchesSearch = labelMatch || categoryMatch || amountMatch;
    }

    return matchesType && matchesDate && matchesCategory && matchesPayment && matchesSearch;
  });
}
