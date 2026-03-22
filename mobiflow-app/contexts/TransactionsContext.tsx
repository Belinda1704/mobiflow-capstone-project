// Holds the logged-in user's transactions so screens share the same list.
import React, { createContext, useContext, useEffect, useMemo, useState, useRef, startTransition } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribeToTransactions } from '../services/transactionsService';
import { useCurrentUser } from '../hooks/useCurrentUser';
import type { Transaction } from '../types/transaction';
import { hydrateDisplayLabels, applyDisplayLabels } from '../services/localDisplayLabelsService';
import { hydrateDisplayNotes, applyDisplayNotes } from '../services/localDisplayNotesService';
import { runSmsPrivacyMigrationOnce } from '../services/transactionsPrivacyMigration';
import { warmStatementBusinessLabelCache } from '../services/preferencesService';

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

  // Preload statement label so Credit Readiness shows business name without an extra beat.
  useEffect(() => {
    if (!userId || userId === '') return;
    void warmStatementBusinessLabelCache();
  }, [userId]);

  // Subscribe when user logs in; screens read from here.
  useEffect(() => {
    if (!userId || userId === '') {
      setTransactions([]);
      setLoading(false);
      hasReceivedDataRef.current = false;
      return;
    }

    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
    hasReceivedDataRef.current = false;
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    // 1) Read AsyncStorage cache first (no startTransition — paint immediately).
    // 2) Only show loading=true when there is no usable cache (first install / cleared storage).
    // 3) Firestore updates use startTransition so UI stays responsive.
    (async () => {
      await hydrateDisplayLabels(userId);
      await hydrateDisplayNotes(userId);

      let hasCache = false;
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (raw) {
          const cached: Transaction[] = JSON.parse(raw);
          if (Array.isArray(cached) && cached.length > 0) {
            const forUser = cached.filter((t) => t.userId === userId);
            const merged = applyDisplayNotes(userId, applyDisplayLabels(userId, forUser));
            if (!cancelled) {
              setTransactions(merged);
              setLoading(false);
              hasReceivedDataRef.current = true;
              hasCache = true;
            }
          }
        }
      } catch {
        // Ignore cache errors; Firestore listener will still populate.
      }

      if (!cancelled && !hasCache) {
        setLoading(true);
      }

      if (cancelled) return;

      unsubscribe = subscribeToTransactions(userId, (list) => {
        void (async () => {
          await hydrateDisplayLabels(userId);
          await hydrateDisplayNotes(userId);
          if (!hasReceivedDataRef.current) {
            hasReceivedDataRef.current = true;
            setLoading(false);
          }
          const merged = applyDisplayNotes(userId, applyDisplayLabels(userId, list));
          startTransition(() => {
            setTransactions(merged);
          });
          AsyncStorage.setItem(cacheKey, JSON.stringify(list)).catch(() => {});
          await runSmsPrivacyMigrationOnce(userId, list);
        })();
      });

      if (cancelled) {
        unsubscribe?.();
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
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
