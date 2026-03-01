import { useEffect, useState, useMemo } from 'react';
import { getCategoryBudgets } from '../services/savingsGoalsService';
import {
  checkIncomeDrop,
  checkBudgetBreaches,
  getAnomalousTransactionIds,
  getTotalExpenseThisMonth,
  type IncomeDropAlert,
  type BudgetBreachAlert,
} from '../services/alertsCheckService';
import type { Transaction } from '../types/transaction';

const INCOME_DROP_THRESHOLD_PERCENT = 20;

export function useAlertsCheck(userId: string | null, transactions: Transaction[]) {
  const [categoryBudgets, setCategoryBudgets] = useState<{ category: string; budget: number }[]>([]);

  useEffect(() => {
    if (!userId) {
      setCategoryBudgets([]);
      return;
    }
    getCategoryBudgets(userId).then(setCategoryBudgets);
  }, [userId]);

  const { incomeDrop, budgetBreaches, anomalousIds, totalExpenseThisMonth } = useMemo(() => {
    const incomeDrop = checkIncomeDrop(transactions, INCOME_DROP_THRESHOLD_PERCENT);
    const budgetBreaches = checkBudgetBreaches(transactions, categoryBudgets);
    const anomalousIds = getAnomalousTransactionIds(transactions, 2);
    const totalExpenseThisMonth = getTotalExpenseThisMonth(transactions);
    return { incomeDrop, budgetBreaches, anomalousIds, totalExpenseThisMonth };
  }, [transactions, categoryBudgets]);

  return { incomeDrop, budgetBreaches, anomalousIds, totalExpenseThisMonth };
}
