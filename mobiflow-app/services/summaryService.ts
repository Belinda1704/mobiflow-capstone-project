// Dashboard: balance, chart values, recent transactions.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';
import { formatDayKey } from '../utils/dateUtils';

export type HomeSummary = {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  chartLabels: string[];
  chartData: number[];
  chartDataIncome: number[];
  chartDataExpense: number[];
  recentTransactions: Transaction[];
};

export function computeHomeSummary(transactions: Transaction[]): HomeSummary {
  const totalIncome = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
  );
  const net = totalIncome - totalExpense;
  const balance = net;

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const dayBuckets: Record<string, { income: number; expense: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    dayBuckets[formatDayKey(d)] = { income: 0, expense: 0 };
  }

  for (const t of transactions) {
    const date = getTransactionDate(t);
    if (!date || date < sevenDaysAgo) continue;
    const key = formatDayKey(date);
    if (!dayBuckets[key]) continue;
    if (t.amount > 0) dayBuckets[key].income += t.amount;
    else dayBuckets[key].expense += Math.abs(t.amount);
  }

  const chartLabels: string[] = [];
  const chartData: number[] = [];
  const chartDataIncome: number[] = [];
  const chartDataExpense: number[] = [];
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
    chartLabels.push(dayNames[dayIndex]);
    const bucket = dayBuckets[formatDayKey(d)];
    const flow = (bucket.income - bucket.expense) / 1000;
    chartData.push(Math.round(flow));
    chartDataIncome.push(Math.round(bucket.income / 1000));
    chartDataExpense.push(Math.round(bucket.expense / 1000));
  }

  const recentTransactions = transactions.slice(0, 5);

  return {
    balance,
    totalIncome,
    totalExpense,
    net,
    chartLabels,
    chartData,
    chartDataIncome,
    chartDataExpense,
    recentTransactions,
  };
}
