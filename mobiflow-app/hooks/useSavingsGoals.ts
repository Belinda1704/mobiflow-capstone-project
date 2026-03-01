// savings goals and category budgets - fetches from Firestore, computes progress with transaction spend
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  getSavingsGoals,
  getCategoryBudgets,
  saveSavingsGoal,
  deleteSavingsGoal,
  saveCategoryBudget,
} from '../services/savingsGoalsService';
import type { SavingsGoal, CategoryBudget } from '../services/savingsGoalsService';
import { computeReports } from '../services/reportsService';
import { computeSuggestedBudgets, getSuggestedSavingsGoal } from '../utils/suggestedBudgets';
import type { Transaction } from '../types/transaction';
import { showError } from '../services/errorPresenter';

export type SavingsGoalWithProgress = SavingsGoal & { percent: number };
export type CategoryBudgetWithSpend = { category: string; budget: number; spent: number; percent: number };

export function useSavingsGoals(userId: string | null, transactions: Transaction[]) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  // Start with loading: false to show UI immediately
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setBudgets([]);
      setLoading(false);
      return;
    }
    // Load goals/budgets asynchronously - don't block UI
    Promise.all([getSavingsGoals(userId), getCategoryBudgets(userId)])
      .then(([g, b]) => {
        setGoals(g);
        setBudgets(b);
        setLoading(false);
      })
      .catch(() => {
        // Don't show error immediately - might be offline, cached data will load
        setLoading(false);
      });
  }, [userId]);

  const addOrUpdateGoal = useCallback(
    async (goal: Omit<SavingsGoal, 'id' | 'createdAt'>) => {
      if (!userId) return null;
      try {
        const saved = await saveSavingsGoal(userId, goal);
        setGoals((prev) => {
          const others = prev.filter((g) => g.id !== saved.id);
          return [...others, saved];
        });
        return saved;
      } catch {
        showError('Error', 'Could not save goal.');
        return null;
      }
    },
    [userId]
  );

  const removeGoal = useCallback(
    async (goalId: string) => {
      if (!userId) return;
      try {
        await deleteSavingsGoal(userId, goalId);
        setGoals((prev) => prev.filter((g) => g.id !== goalId));
      } catch {
        showError('Error', 'Could not delete goal.');
      }
    },
    [userId]
  );

  const addOrUpdateBudget = useCallback(
    async (category: string, budget: number) => {
      if (!userId) return null;
      try {
        const saved = await saveCategoryBudget(userId, category, budget);
        setBudgets((prev) => {
          const others = prev.filter((b) => b.category !== category);
          return [...others, saved];
        });
        return saved;
      } catch {
        showError('Error', 'Could not save budget.');
        return null;
      }
    },
    [userId]
  );

  const reports = useMemo(() => computeReports(transactions), [transactions]);
  const expenseByCategory = Object.fromEntries(
    reports.categories.map((c) => [c.name, c.amount])
  );

  const goalsWithProgress: SavingsGoalWithProgress[] = goals.map((g) => ({
    ...g,
    percent: g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0,
  }));

  const budgetsWithSpend: CategoryBudgetWithSpend[] = budgets.map((b) => {
    const spent = expenseByCategory[b.category] ?? 0;
    const percent = b.budget > 0 ? Math.min(100, Math.round((spent / b.budget) * 100)) : 0;
    return { ...b, spent, percent };
  });

  const topSpendingCategories = reports.categories
    .filter((c) => c.amount > 0)
    .map((c) => ({ name: c.name, percent: c.percent }))
    .slice(0, 6);

  const suggestedBudgets = useMemo(
    () => computeSuggestedBudgets(transactions),
    [transactions]
  );

  const suggestedSavingsGoal = useMemo(
    () => getSuggestedSavingsGoal(transactions),
    [transactions]
  );

  return {
    goals: goalsWithProgress,
    budgets: budgetsWithSpend,
    topSpendingCategories,
    suggestedBudgets,
    suggestedSavingsGoal,
    loading,
    addOrUpdateGoal,
    removeGoal,
    addOrUpdateBudget,
  };
}
