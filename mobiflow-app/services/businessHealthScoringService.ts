// Business health: weighted formula (cash flow, income trend, expenses, savings). Not ML.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';

export type BusinessHealthFactors = {
  cashFlowStability: number;
  incomeGrowthTrend: number;
  expenseEfficiency: number;
  savingsConsistency: number;
  transactionRegularity: number;
};

// 0–100 from income, expenses, stability, regularity
export function analyzeBusinessHealth(
  transactions: Transaction[],
  totalIncome: number,
  totalExpense: number,
  net: number,
  monthsData: number
): {
  healthScore: number;
  factors: BusinessHealthFactors;
  confidence: number;
} {
  if (transactions.length < 3 || monthsData < 1) {
    return {
      healthScore: 0,
      factors: {
        cashFlowStability: 0,
        incomeGrowthTrend: 0,
        expenseEfficiency: 0,
        savingsConsistency: 0,
        transactionRegularity: 0,
      },
      confidence: 0,
    };
  }

  const cashFlowStability = calculateCashFlowStability(transactions, monthsData);
  const incomeGrowthTrend = calculateIncomeGrowthTrend(transactions, monthsData);
  const expenseEfficiency = calculateExpenseEfficiency(transactions, monthsData);
  const savingsConsistency = calculateSavingsConsistency(transactions, monthsData);
  const transactionRegularity = calculateTransactionRegularity(transactions);

  const factors: BusinessHealthFactors = {
    cashFlowStability,
    incomeGrowthTrend,
    expenseEfficiency,
    savingsConsistency,
    transactionRegularity,
  };

  const healthScore = Math.round(
    cashFlowStability * 25 +
    incomeGrowthTrend * 20 +
    expenseEfficiency * 20 +
    savingsConsistency * 20 +
    transactionRegularity * 15
  );
  const confidence = Math.min(1, transactions.length / 30);

  return {
    healthScore: Math.min(100, Math.max(0, healthScore)),
    factors,
    confidence,
  };
}

function calculateCashFlowStability(transactions: Transaction[], monthsData: number): number {
  const monthlyNet: number[] = [];
  const buckets: Record<string, { income: number; expense: number }> = {};

  for (const tx of transactions) {
    const date = getTransactionDate(tx);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { income: 0, expense: 0 };
    if (tx.amount > 0) buckets[key].income += tx.amount;
    else buckets[key].expense += Math.abs(tx.amount);
  }

  for (const bucket of Object.values(buckets)) {
    monthlyNet.push(bucket.income - bucket.expense);
  }

  if (monthlyNet.length < 2) return 0.5;

  const avg = monthlyNet.reduce((a, b) => a + b, 0) / monthlyNet.length;
  const variance = monthlyNet.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / monthlyNet.length;
  const stdDev = Math.sqrt(variance);

  const maxStdDev = Math.abs(avg) * 2 || 1;
  const stability = Math.max(0, 1 - (stdDev / maxStdDev));
  return Math.min(1, stability);
}

function calculateIncomeGrowthTrend(transactions: Transaction[], monthsData: number): number {
  const monthlyIncome: number[] = [];
  const buckets: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.amount <= 0) continue;
    const date = getTransactionDate(tx);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = (buckets[key] || 0) + tx.amount;
  }

  const sortedKeys = Object.keys(buckets).sort();
  monthlyIncome.push(...sortedKeys.map((k) => buckets[k]));

  if (monthlyIncome.length < 2) return 0.5;

  const n = monthlyIncome.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = monthlyIncome.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * monthlyIncome[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const avgIncome = sumY / n;

  if (avgIncome === 0) return 0.5;
  const growthRate = slope / avgIncome;
  const trend = 0.5 + Math.max(-0.5, Math.min(0.5, growthRate * 10));
  return Math.max(0, Math.min(1, trend));
}

function calculateExpenseEfficiency(transactions: Transaction[], monthsData: number): number {
  const monthlyRatios: number[] = [];
  const buckets: Record<string, { income: number; expense: number }> = {};

  for (const tx of transactions) {
    const date = getTransactionDate(tx);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { income: 0, expense: 0 };
    if (tx.amount > 0) buckets[key].income += tx.amount;
    else buckets[key].expense += Math.abs(tx.amount);
  }

  for (const bucket of Object.values(buckets)) {
    if (bucket.income > 0) {
      monthlyRatios.push(bucket.expense / bucket.income);
    } else {
      monthlyRatios.push(1);
    }
  }

  if (monthlyRatios.length === 0) return 0.5;

  const avgRatio = monthlyRatios.reduce((a, b) => a + b, 0) / monthlyRatios.length;
  const efficiency = Math.max(0, 1 - avgRatio);
  return Math.min(1, efficiency);
}

function calculateSavingsConsistency(transactions: Transaction[], monthsData: number): number {
  const buckets: Record<string, { income: number; expense: number }> = {};

  for (const tx of transactions) {
    const date = getTransactionDate(tx);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) buckets[key] = { income: 0, expense: 0 };
    if (tx.amount > 0) buckets[key].income += tx.amount;
    else buckets[key].expense += Math.abs(tx.amount);
  }

  const months = Object.keys(buckets).length;
  if (months === 0) return 0;

  let positiveMonths = 0;
  for (const bucket of Object.values(buckets)) {
    if (bucket.income - bucket.expense > 0) positiveMonths++;
  }
  return positiveMonths / months;
}

function calculateTransactionRegularity(transactions: Transaction[]): number {
  if (transactions.length < 3) return 0.5;

  const dates = transactions
    .map((t) => getTransactionDate(t))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length < 2) return 0.5;

  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const days = Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    intervals.push(days);
  }

  if (intervals.length === 0) return 0.5;

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  if (avgInterval === 0) return 0.5;
  const coefficientOfVariation = stdDev / avgInterval;
  const regularity = Math.max(0, 1 - coefficientOfVariation);
  return Math.min(1, regularity);
}
