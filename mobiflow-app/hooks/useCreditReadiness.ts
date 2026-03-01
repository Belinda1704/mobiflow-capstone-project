// credit readiness data from transactions and user profile
import { useMemo } from 'react';
import {
  computeCreditReadiness,
  computeCreditReadinessForPeriod,
  getLastNMonthsRange,
} from '../services/financialInsightsService';
import type { Transaction } from '../types/transaction';
import { getDisplayLabelFromAuthId } from '../utils/userUtils';

export type CreditReadinessPeriod = {
  startYearMonth: string;
  endYearMonth: string;
};

export function useCreditReadiness(
  transactions: Transaction[],
  authId: string,
  period: CreditReadinessPeriod | null
) {
  const userName = useMemo(() => getDisplayLabelFromAuthId(authId), [authId]);
  const businessName = 'My Business';
  const effectivePeriod = useMemo(
    () => period ?? getLastNMonthsRange(6),
    [period]
  );
  return useMemo(
    () =>
      computeCreditReadinessForPeriod(
        transactions,
        userName,
        businessName,
        effectivePeriod.startYearMonth,
        effectivePeriod.endYearMonth
      ),
    [transactions, userName, effectivePeriod.startYearMonth, effectivePeriod.endYearMonth]
  );
}
