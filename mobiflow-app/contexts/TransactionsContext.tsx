// Holds the logged-in user's transactions so screens share the same list.
import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { subscribeToTransactions } from '../services/transactionsService';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { Transaction } from '../types/transaction';

type TransactionsContextType = {
  transactions: Transaction[];
  loading: boolean;
};

const TransactionsContext = createContext<TransactionsContextType | null>(null);

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const { userId } = useCurrentUser();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const hasReceivedDataRef = useRef(false);

  // Subscribe when user logs in; screens read from here.
  useEffect(() => {
    if (!userId || userId === '') {
      setTransactions([]);
      setLoading(false);
      hasReceivedDataRef.current = false;
      return;
    }

    hasReceivedDataRef.current = false;
    setLoading(true); // avoid showing empty list then suddenly filling
    const unsubscribe = subscribeToTransactions(userId, (list) => {
      setTransactions(list);
      if (!hasReceivedDataRef.current) {
        hasReceivedDataRef.current = true;
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [userId]);

  const value = useMemo(() => ({ transactions, loading }), [transactions, loading]);
  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

// Use in screens to get the transaction list.
export function useTransactionsContext(): TransactionsContextType {
  const ctx = useContext(TransactionsContext);
  if (!ctx) {
    return { transactions: [], loading: false };
  }
  return ctx;
}
