// fetches user transactions and keeps them updated
import { useEffect, useState } from 'react';

import { subscribeToTransactions } from '../services/transactionsService';
import type { Transaction } from '../types/transaction';

export function useTransactions(userId: string): {
  transactions: Transaction[];
  loading: boolean;
} {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToTransactions(userId, (list) => {
      setTransactions(list);
      setLoading(false);
    });
    return unsubscribe;
  }, [userId]);

  return { transactions, loading };
}
