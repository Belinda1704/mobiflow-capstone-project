/** Transactions for the current user from context. Returns empty list if not logged in. */
import { useTransactionsContext } from '../contexts/TransactionsContext';

export function useTransactions(userId: string | null): {
  transactions: import('../types/transaction').Transaction[];
  loading: boolean;
} {
  const { transactions, loading } = useTransactionsContext();
  return { transactions: userId ? transactions : [], loading };
}
