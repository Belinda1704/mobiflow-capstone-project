// business insights data from transactions
import { useMemo } from 'react';
import { computeBusinessInsights } from '../services/financialInsightsService';
import type { Transaction } from '../types/transaction';

export function useBusinessInsights(transactions: Transaction[]) {
  return useMemo(() => computeBusinessInsights(transactions), [transactions]);
}
