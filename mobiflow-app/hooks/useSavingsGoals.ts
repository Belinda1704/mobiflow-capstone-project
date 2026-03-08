// savings goals and category budgets - fetches from Firestore, computes progress with transaction spend
import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const CACHE_GOALS_PREFIX = '@mobiflow/cachedSavingsGoals_';
const CACHE_BUDGETS_PREFIX = '@mobiflow/cachedCategoryBudgets_';

function cacheKeyGoals(uid: string) {
  return CACHE_GOALS_PREFIX + uid;
}
function cacheKeyBudgets(uid: string) {
  return CACHE_BUDGETS_PREFIX + uid;
}

export type SavingsGoalWithProgress = SavingsGoal & { percent: number };
export type CategoryBudgetWithSpend = { category: string; budget: number; spent: number; percent: number };

export function useSavingsGoals(userId: string | null, transactions: Transaction[]) {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGoalsAndBudgets = useCallback(() => {
    if (!userId) {
      setGoals([]);
      setBudgets([]);
      setLoading(false);
      return;
    }
    Promise.all([getSavingsGoals(userId), getCategoryBudgets(userId)])
      .then(([g, b]) => {
        setGoals(g);
        setBudgets(b);
        setLoading(false);
        AsyncStorage.setItem(cacheKeyGoals(userId), JSON.stringify(g)).catch(() => {});
        AsyncStorage.setItem(cacheKeyBudgets(userId), JSON.stringify(b)).catch(() => {});
      })
      .catch(() => {
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setBudgets([]);
      return;
    }
    let cancelled = false;
    Promise.all([
      AsyncStorage.getItem(cacheKeyGoals(userId)),
      AsyncStorage.getItem(cacheKeyBudgets(userId)),
    ])
      .then(([goalsJson, budgetsJson]) => {
        if (cancelled) return;
        try {
          const g = goalsJson ? (JSON.parse(goalsJson) as SavingsGoal[]) : [];
          if (Array.isArray(g)) setGoals(g);
        } catch {}
        try {
          const b = budgetsJson ? (JSON.parse(budgetsJson) as CategoryBudget[]) : [];
          if (Array.isArray(b)) setBudgets(b);
        } catch {}
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) fetchGoalsAndBudgets();
      });
    return () => {
      cancelled = true;
    };
  }, [userId, fetchGoalsAndBudgets]);

  const addOrUpdateGoal = useCallback(
    async (goal: Omit<SavingsGoal, 'id' | 'createdAt'> | SavingsGoal) => {
      if (!userId) return null;
      try {
        const saved = await saveSavingsGoal(userId, goal);
        setGoals((prev) => {
          const next = [...prev.filter((g) => g.id !== saved.id), saved];
          AsyncStorage.setItem(cacheKeyGoals(userId), JSON.stringify(next)).catch(() => {});
          return next;
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
        setGoals((prev) => {
          const next = prev.filter((g) => g.id !== goalId);
          AsyncStorage.setItem(cacheKeyGoals(userId), JSON.stringify(next)).catch(() => {});
          return next;
        });
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
          const next = [...prev.filter((b) => b.category !== category), saved];
          AsyncStorage.setItem(cacheKeyBudgets(userId), JSON.stringify(next)).catch(() => {});
          return next;
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
    refetch: fetchGoalsAndBudgets,
    addOrUpdateGoal,
    removeGoal,
    addOrUpdateBudget,
  };
}
