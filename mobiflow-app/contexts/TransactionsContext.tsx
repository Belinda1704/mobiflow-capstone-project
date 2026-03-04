// Holds the logged-in user's transactions so screens share the same list.
import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribeToTransactions } from '../services/transactionsService';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { Transaction } from '../types/transaction';

type TransactionsContextType = {
  transactions: Transaction[];
  loading: boolean;
};

const TransactionsContext = createContext<TransactionsContextType | null>(null);

const CACHE_KEY_PREFIX = '@mobiflow/transactionsCache_';

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

    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    // 1) Try to hydrate from local cache first so returning users
    //    immediately see their last known transactions while Firestore syncs.
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) {
          const cached: Transaction[] = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            setTransactions(cached);
          }
        }
      } catch {
        // Ignore cache errors; Firestore listener will still populate.
      }
    })();

    hasReceivedDataRef.current = false;
    setLoading(true); // avoid showing empty list then suddenly filling
    const unsubscribe = subscribeToTransactions(userId, (list) => {
      setTransactions(list);
      // Keep a fresh copy in local storage for next cold start.
      AsyncStorage.setItem(cacheKey, JSON.stringify(list)).catch(() => {});
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
