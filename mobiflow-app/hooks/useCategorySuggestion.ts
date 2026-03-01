import { useState, useEffect, useCallback } from 'react';
import {
  getCategorizationRules,
  getCategoryCorrections,
  suggestCategory as suggestCategoryFn,
} from '../services/categorizationService';
import type { Transaction } from '../types/transaction';

export function useCategorySuggestion(userId: string | null, transactions: Transaction[]) {
  const [rules, setRules] = useState<Awaited<ReturnType<typeof getCategorizationRules>>>([]);
  const [corrections, setCorrections] = useState<Awaited<ReturnType<typeof getCategoryCorrections>>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setRules([]);
      setCorrections([]);
      setReady(false);
      return;
    }
    let cancelled = false;
    Promise.all([getCategorizationRules(userId), getCategoryCorrections(userId)]).then(
      ([r, c]) => {
        if (!cancelled) {
          setRules(r);
          setCorrections(c);
          setReady(true);
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const suggest = useCallback(
    (label: string, type: 'income' | 'expense'): string | null => {
      return suggestCategoryFn(label, type, rules, corrections, transactions);
    },
    [rules, corrections, transactions]
  );

  return { suggest, ready };
}
