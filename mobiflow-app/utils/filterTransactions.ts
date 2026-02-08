// filters txns by type (all/income/expense) and search
import type { Transaction, FilterTab } from '../types/transaction';

export function filterTransactions(
  transactions: Transaction[],
  filter: FilterTab,
  search: string
): Transaction[] {
  const searchTerm = search.trim().toLowerCase();
  return transactions.filter((t) => {
    const matchesType = filter === 'all' || t.type === filter;
    const matchesSearch = !searchTerm || t.label.toLowerCase().includes(searchTerm);
    return matchesType && matchesSearch;
  });
}
