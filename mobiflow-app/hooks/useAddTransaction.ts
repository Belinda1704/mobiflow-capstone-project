// adds a transaction and handles validation + errors
import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

import { addTransaction as saveTransaction } from '../services/transactionsService';
import type { CreateTransactionInput } from '../types/transaction';

export function useAddTransaction(userId: string): {
  addTransaction: (input: CreateTransactionInput) => Promise<boolean>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  const add = useCallback(
    async (input: CreateTransactionInput): Promise<boolean> => {
      if (!input.label.trim()) {
        Alert.alert('Error', 'Please enter a description.');
        return false;
      }
      const amount = parseInt(String(input.amount), 10);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid amount.');
        return false;
      }
      setLoading(true);
      try {
        await saveTransaction(userId, {
          ...input,
          amount,
        });
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to add transaction.';
        Alert.alert('Error', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return { addTransaction: add, loading };
}
