// Credit readiness: builds report from tx + profile name (loads on mount + focus).
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  computeCreditReadinessForPeriod,
  getLastNMonthsRange,
} from '../services/financialInsightsService';
import type { Transaction } from '../types/transaction';
import { getDisplayLabelFromAuthId } from '../utils/userUtils';
import { getStatementBusinessLabel } from '../services/preferencesService';

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
  const [businessName, setBusinessName] = useState('My Business');

  const reloadBusinessLabel = useCallback(() => {
    getStatementBusinessLabel().then(setBusinessName);
  }, []);

  useEffect(() => {
    reloadBusinessLabel();
  }, [reloadBusinessLabel]);

  useFocusEffect(
    useCallback(() => {
      reloadBusinessLabel();
    }, [reloadBusinessLabel])
  );

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
    [transactions, userName, businessName, effectivePeriod.startYearMonth, effectivePeriod.endYearMonth]
  );
}
