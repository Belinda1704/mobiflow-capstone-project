// Report data from transactions: totals, categories, stacked chart.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';
import { getCategoryConfig } from '../utils/categoryUtils';
import type { CategoryIcon } from '../constants/categories';
import { DEFAULT_SME_CATEGORIES } from '../constants/categories';
import { formatDayKey } from '../utils/dateUtils';

function normalizeCategoryKey(name: string): string {
  const key = name.trim().toLowerCase();
  // Alias so it merges with Inventory
  if (key === 'ininventory') return 'inventory';
  return key;
}

function toDisplayCategory(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Other';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export type CategoryReport = {
  name: string;
  percent: number;
  amount: number;
  count: number;
  color: string;
  chartColor: string;
  icon: CategoryIcon;
};

export type ReportsData = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  categories: CategoryReport[];
  stackedChartData: {
    labels: string[];
    legend: string[];
    data: number[][];
    barColors: string[];
  };
};

export function computeReports(transactions: Transaction[]): ReportsData {
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
  );
  const net = totalIncome - totalExpense;

  const expenseByCategory: Record<string, { amount: number; count: number }> = {};
  const displayByKey: Record<string, string> = {};
  const defaultByKey: Record<string, string> = DEFAULT_SME_CATEGORIES.reduce((acc, c) => {
    acc[normalizeCategoryKey(c.name)] = c.name;
    return acc;
  }, {} as Record<string, string>);

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const raw = t.category?.trim() || 'Other';
    const key = normalizeCategoryKey(raw);
    if (!expenseByCategory[key]) expenseByCategory[key] = { amount: 0, count: 0 };
    if (!displayByKey[key]) {
      displayByKey[key] = defaultByKey[key] ?? toDisplayCategory(raw);
    }
    expenseByCategory[key].amount += Math.abs(t.amount);
    expenseByCategory[key].count += 1;
  }

  const categoryKeysFromData = Object.keys(expenseByCategory).sort();
  const defaultKeys = DEFAULT_SME_CATEGORIES.map((c) => normalizeCategoryKey(c.name));
  const allCategoryKeys = [...new Set([...defaultKeys, ...categoryKeysFromData])];
  for (const key of allCategoryKeys) {
    if (!expenseByCategory[key]) expenseByCategory[key] = { amount: 0, count: 0 };
    if (!displayByKey[key]) displayByKey[key] = defaultByKey[key] ?? 'Other';
  }

  let categories: CategoryReport[] = allCategoryKeys.map((key) => {
    const entry = expenseByCategory[key] ?? { amount: 0, count: 0 };
    const name = displayByKey[key] ?? 'Other';
    const { amount, count } = entry;
    const percent = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
    const config = getCategoryConfig(name);
    return {
      name,
      percent,
      amount,
      count,
      color: config.color,
      chartColor: config.chartColor ?? config.color,
      icon: config.icon,
    };
  });

  // Fix rounding so percents sum to 100
  if (totalExpense > 0 && categories.length > 0) {
    const sum = categories.reduce((s, c) => s + c.percent, 0);
    if (sum !== 100) {
      const diff = 100 - sum;
      const byAmount = [...categories].sort((a, b) => b.amount - a.amount);
      const adjustKey = byAmount[0].name;
      categories = categories.map((c) =>
        c.name === adjustKey ? { ...c, percent: Math.max(0, c.percent + diff) } : c
      );
    }
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dayBuckets: Record<string, { income: number; expense: number }> = {};
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const key = formatDayKey(d);
    dayBuckets[key] = { income: 0, expense: 0 };
    labels.push(['M', 'T', 'W', 'T', 'F', 'S', 'S'][d.getDay() === 0 ? 6 : d.getDay() - 1]);
  }

  for (const t of transactions) {
    const date = getTransactionDate(t);
    if (!date || date < sevenDaysAgo) continue;
    const key = formatDayKey(date);
    if (!dayBuckets[key]) continue;
    if (t.amount > 0) dayBuckets[key].income += t.amount;
    else dayBuckets[key].expense += Math.abs(t.amount);
  }

  const data: number[][] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const bucket = dayBuckets[formatDayKey(d)];
    data.push([Math.round(bucket.income / 1000), Math.round(bucket.expense / 1000)]);
  }

  const stackedChartData = {
    labels,
    legend: ['Income', 'Expense'],
    data,
    barColors: ['#22C55E', '#EF4444'],
  };

  return {
    totalIncome,
    totalExpense,
    net,
    categories,
    stackedChartData,
  };
}
