// adds a transaction and handles validation + errors
import { useState, useCallback } from 'react';

import { addTransaction as saveTransaction } from '../services/transactionsService';
import { showError } from '../services/errorPresenter';
import { recordTransactionCompleted } from '../services/notificationTriggerService';
import type { CreateTransactionInput } from '../types/transaction';

export function useAddTransaction(userId: string): {
  addTransaction: (input: CreateTransactionInput) => Promise<boolean>;
  loading: boolean;
} {
  const [loading, setLoading] = useState(false);

  const add = useCallback(
    async (input: CreateTransactionInput): Promise<boolean> => {
      if (!input.label.trim()) {
        showError('Error', 'Please enter a description.');
        return false;
      }
      const amount = parseInt(String(input.amount), 10);
      if (isNaN(amount) || amount <= 0) {
        showError('Error', 'Please enter a valid amount.');
        return false;
      }
      setLoading(true);
      try {
        await saveTransaction(userId, {
          ...input,
          amount,
        });
        recordTransactionCompleted(userId, input.label.trim(), amount).catch(() => {});
        return true;
      } catch (err: unknown) {
        // Check if it's an offline error - Firestore queues writes automatically
        const error = err as any;
        if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
          // Transaction is queued and will sync when online
          // Return true to indicate success
          return true;
        }
        const message = err instanceof Error ? err.message : 'Failed to add transaction.';
        showError('Error', message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  return { addTransaction: add, loading };
}
