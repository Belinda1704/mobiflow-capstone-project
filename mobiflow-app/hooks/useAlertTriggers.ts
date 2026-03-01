// Centralizes alert/notification triggers (low balance, budget breach, expense limit, income drop)
// so screens only consume one hook instead of calling trigger services directly.
import { useEffect } from 'react';
import {
  triggerLowBalanceIfNeeded,
  triggerBudgetOverspentIfNeeded,
  triggerExpenseLimitIfNeeded,
  triggerIncomeDropIfNeeded,
} from '../services/notificationTriggerService';
import type { AlertSettings } from '../services/alertsService';

export type BudgetBreach = { category: string; spent: number; budget: number };

export function useAlertTriggers(
  userId: string | undefined,
  balance: number | undefined,
  alertSettings: AlertSettings | undefined,
  budgetBreaches: BudgetBreach[],
  totalExpenseThisMonth: number,
  incomeDropPercent: number | null
) {
  useEffect(() => {
    if (!userId || !alertSettings?.notifyOnLowBalance) return;
    const bal = balance ?? 0;
    const threshold = alertSettings.lowBalanceThreshold ?? 50000;
    triggerLowBalanceIfNeeded(userId, bal, threshold);
  }, [userId, balance, alertSettings?.notifyOnLowBalance, alertSettings?.lowBalanceThreshold]);

  useEffect(() => {
    if (!userId || budgetBreaches.length === 0) return;
    budgetBreaches.forEach((b) => {
      triggerBudgetOverspentIfNeeded(userId, b.category, b.spent - b.budget);
    });
  }, [userId, budgetBreaches]);

  useEffect(() => {
    if (!userId || !alertSettings) return;
    const limit = alertSettings.expenseLimitMonthly ?? 500000;
    triggerExpenseLimitIfNeeded(
      userId,
      totalExpenseThisMonth,
      limit,
      alertSettings.notifyOnExpenseLimit ?? true
    );
  }, [userId, totalExpenseThisMonth, alertSettings?.expenseLimitMonthly, alertSettings?.notifyOnExpenseLimit]);

  useEffect(() => {
    if (!userId || incomeDropPercent == null) return;
    triggerIncomeDropIfNeeded(userId, incomeDropPercent);
  }, [userId, incomeDropPercent]);
}
