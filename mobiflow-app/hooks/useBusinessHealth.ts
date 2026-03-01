// business health data from transactions
import { useMemo } from 'react';
import { computeBusinessHealth } from '../services/financialInsightsService';
import type { Transaction } from '../types/transaction';

export function useBusinessHealth(transactions: Transaction[]) {
  return useMemo(() => computeBusinessHealth(transactions), [transactions]);
}
