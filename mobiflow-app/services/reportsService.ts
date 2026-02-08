// takes all transactions and turns them into report data (totals, categories, charts)
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';
import { getCategoryConfig } from '../utils/categoryUtils';
import type { CategoryIcon } from '../constants/categories';
import { DEFAULT_SME_CATEGORIES } from '../constants/categories';
import { formatDayKey } from '../utils/dateUtils';

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
  pieData: { name: string; amount: number; color: string }[];
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

  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const cat = t.category?.trim() || 'Other';
    if (!expenseByCategory[cat]) expenseByCategory[cat] = { amount: 0, count: 0 };
    expenseByCategory[cat].amount += Math.abs(t.amount);
    expenseByCategory[cat].count += 1;
  }

  const categoryNamesFromData = Object.keys(expenseByCategory).sort();
  const allCategoryNames = [...new Set([...DEFAULT_SME_CATEGORIES.map((c) => c.name), ...categoryNamesFromData])];
  for (const name of allCategoryNames) {
    if (!expenseByCategory[name]) expenseByCategory[name] = { amount: 0, count: 0 };
  }

  const categories: CategoryReport[] = allCategoryNames.map((name) => {
    const entry = expenseByCategory[name] ?? { amount: 0, count: 0 };
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

  const pieData = categories.map((c) => ({ name: c.name, amount: c.amount, color: c.chartColor }));

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
    pieData,
    stackedChartData,
  };
}
