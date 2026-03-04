import { filterTransactions } from '../../utils/filterTransactions';
import type { Transaction } from '../../types/transaction';

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const lastMonth = new Date(today);
lastMonth.setMonth(lastMonth.getMonth() - 1);

function tx(overrides: Partial<Transaction> & { createdAt: Date }): Transaction {
  return {
    id: '1',
    userId: 'u1',
    label: 'Test',
    amount: 1000,
    type: 'income',
    category: 'Other',
    paymentMethod: 'mobile_money',
    ...overrides,
    createdAt: overrides.createdAt,
  } as Transaction;
}

const todayIncome = tx({ id: '1', amount: 5000, type: 'income', label: 'Sale', createdAt: today });
const todayExpense = tx({ id: '2', amount: -2000, type: 'expense', label: 'Rent', category: 'Rent', createdAt: today });
const yesterdayIncome = tx({ id: '3', amount: 3000, type: 'income', label: 'Payment', createdAt: yesterday });
const oldTx = tx({ id: '4', amount: 1000, type: 'expense', label: 'Old', createdAt: lastMonth });
const allTx = [todayIncome, todayExpense, yesterdayIncome, oldTx];

describe('filterTransactions', () => {
  it('returns all when filters are default (all)', () => {
    const result = filterTransactions(allTx, {
      type: 'all',
      dateRange: 'all',
      category: '',
      paymentMethod: 'all',
      search: '',
    });
    expect(result).toHaveLength(4);
  });

  it('filters by type income', () => {
    const result = filterTransactions(allTx, {
      type: 'income',
      dateRange: 'all',
      category: '',
      paymentMethod: 'all',
      search: '',
    });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.type === 'income')).toBe(true);
  });

  it('filters by type expense', () => {
    const result = filterTransactions(allTx, {
      type: 'expense',
      dateRange: 'all',
      category: '',
      paymentMethod: 'all',
      search: '',
    });
    expect(result).toHaveLength(2);
    expect(result.every((t) => t.type === 'expense')).toBe(true);
  });

  it('filters by dateRange month (current month only)', () => {
    const result = filterTransactions(allTx, {
      type: 'all',
      dateRange: 'month',
      category: '',
      paymentMethod: 'all',
      search: '',
    });
    expect(result.map((t) => t.id)).not.toContain('4');
  });
});
