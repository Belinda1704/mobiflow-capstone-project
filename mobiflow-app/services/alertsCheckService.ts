// Alerts: income drop vs last month, budget overruns, odd amounts.
import type { Transaction } from '../types/transaction';
import type { CategoryBudget } from './savingsGoalsService';

function getTransactionDate(t: Transaction): Date {
  const ts = t.createdAt;
  if (!ts) return new Date();
  const x = ts as { seconds?: number; toDate?: () => Date };
  if (x.toDate) return x.toDate();
  if (typeof x.seconds === 'number') return new Date(x.seconds * 1000);
  return new Date();
}

function getMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export type IncomeDropAlert = {
  type: 'income_drop';
  thisMonthIncome: number;
  lastMonthIncome: number;
  percentDrop: number;
  message: string;
};

export type BudgetBreachAlert = {
  type: 'budget_breach';
  category: string;
  spent: number;
  budget: number;
  percentOver: number;
  message: string;
};

export type AlertItem = IncomeDropAlert | BudgetBreachAlert;

// Compare this month income to last; alert if drop above threshold.
export function checkIncomeDrop(
  transactions: Transaction[],
  dropThresholdPercent: number = 20
): IncomeDropAlert | null {
  const now = new Date();
  const thisMonthKey = getMonthKey(now);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = getMonthKey(lastMonth);

  let thisMonthIncome = 0;
  let lastMonthIncome = 0;
  for (const t of transactions) {
    if (t.amount <= 0) continue;
    const d = getTransactionDate(t);
    const key = getMonthKey(d);
    if (key === thisMonthKey) thisMonthIncome += t.amount;
    else if (key === lastMonthKey) lastMonthIncome += t.amount;
  }

  if (lastMonthIncome <= 0) return null;
  const percentDrop = Math.round(((lastMonthIncome - thisMonthIncome) / lastMonthIncome) * 100);
  if (percentDrop < dropThresholdPercent) return null;

  return {
    type: 'income_drop',
    thisMonthIncome,
    lastMonthIncome,
    percentDrop,
    message: `Income down ${percentDrop}% vs last month`,
  };
}

/** See which categories are over budget this month. */
export function checkBudgetBreaches(
  transactions: Transaction[],
  categoryBudgets: CategoryBudget[]
): BudgetBreachAlert[] {
  const now = new Date();
  const thisMonthKey = getMonthKey(now);
  const spentByCategory: Record<string, number> = {};

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const d = getTransactionDate(t);
    if (getMonthKey(d) !== thisMonthKey) continue;
    const cat = t.category?.trim() || 'Other';
    spentByCategory[cat] = (spentByCategory[cat] ?? 0) + Math.abs(t.amount);
  }

  const breaches: BudgetBreachAlert[] = [];
  for (const { category, budget } of categoryBudgets) {
    if (budget <= 0) continue;
    const spent = spentByCategory[category] ?? 0;
    if (spent <= budget) continue;
    const percentOver = Math.round(((spent - budget) / budget) * 100);
    breaches.push({
      type: 'budget_breach',
      category,
      spent,
      budget,
      percentOver,
      message: `${category} over budget by ${percentOver}%`,
    });
  }
  return breaches;
}

// Sum expenses this month.
export function getTotalExpenseThisMonth(transactions: Transaction[]): number {
  const now = new Date();
  const thisMonthKey = getMonthKey(now);
  let total = 0;
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const d = getTransactionDate(t);
    if (getMonthKey(d) !== thisMonthKey) continue;
    total += Math.abs(t.amount);
  }
  return total;
}

// Find odd-looking tx (e.g. amount way above average).
export function getAnomalousTransactionIds(
  transactions: Transaction[],
  multiplier: number = 2
): Set<string> {
  if (transactions.length < 3) return new Set();
  const expenseTx = transactions.filter((t) => t.amount < 0);
  const incomeTx = transactions.filter((t) => t.amount > 0);
  const avgExpense =
    expenseTx.length > 0
      ? Math.abs(expenseTx.reduce((s, t) => s + t.amount, 0)) / expenseTx.length
      : 0;
  const avgIncome =
    incomeTx.length > 0 ? incomeTx.reduce((s, t) => s + t.amount, 0) / incomeTx.length : 0;

  const anomalous = new Set<string>();
  for (const t of transactions) {
    if (t.amount < 0 && avgExpense > 0 && Math.abs(t.amount) >= avgExpense * multiplier) {
      anomalous.add(t.id);
    }
    if (t.amount > 0 && avgIncome > 0 && t.amount >= avgIncome * multiplier) {
      anomalous.add(t.id);
    }
  }
  return anomalous;
}
