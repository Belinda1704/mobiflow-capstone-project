// Business health score, charts, credit-readiness from transactions.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';
import { getCategoryConfig } from '../utils/categoryUtils';
import { DEFAULT_SME_CATEGORIES } from '../constants/categories';
import { analyzeBusinessHealth } from './businessHealthScoringService';
import { predictCreditworthiness } from './creditReadinessClassifier';

function normalizeCategoryKey(name: string): string {
  const key = name.trim().toLowerCase();
  return key || 'other';
}

// Normalize for display (Other/other).
function getDisplayNameForCategoryKey(normalizedKey: string): string {
  const found = DEFAULT_SME_CATEGORIES.find((c) => normalizeCategoryKey(c.name) === normalizedKey);
  if (found) return found.name;
  return normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1);
}

/** One row in the “top spending by category” list. */
export type TopSpendingItem = {
  name: string;
  percent: number;
  color: string;
};

// Income chart bar (Jan, Feb…).
export type IncomeChartItem = {
  month: string;
  amount: number;
  label: string;
};

// 0–100 score + label + message.
export type BusinessHealthScore = {
  score: number;
  label: string;
  message: string;
};

/** One row in the summary (e.g. “Total income”, “Total expense”). */
export type SummaryRow = {
  label: string;
  value: string;
  good?: boolean;
};

export type BusinessHealthData = {
  score: BusinessHealthScore;
  topSpending: TopSpendingItem[];
  income6Months: IncomeChartItem[];
  incomeChangePercent: number;
  summary: SummaryRow[];
};

export type BusinessInsightsData = {
  topSpending: TopSpendingItem[];
  incomeTrend30Days: IncomeChartItem[];
  incomeChangePercent: number;
  forecast: {
    income: number;
    expense: number;
    net: number;
  };
};

// One day in cash flow (in, out, net).
export type CashFlowDayRow = {
  dateLabel: string;
  dateKey: string;
  income: number;
  expense: number;
  net: number;
};

export type CreditReadinessData = {
  userName: string;
  businessName: string;
  cashFlowStability: string;
  avgMonthlyIncome: number;
  avgMonthlyExpense: number;
  savingsRate: number;
  transactionFrequency: number;
  incomeVerification: { status: string; period: string };
  businessStability: { status: string; period: string };
  cashFlowByDay: CashFlowDayRow[];
  reportPeriodLabel: string;
};

// Credit assessment result.
export type CreditworthinessAssessment = {
  verdict: 'creditworthy' | 'needs_improvement' | 'not_creditworthy' | 'insufficient_data';
  reasonKeys: string[];
};

// Wrapper for credit classifier
export function assessCreditworthiness(data: CreditReadinessData): CreditworthinessAssessment {
  return predictCreditworthiness(data);
}

// First 6 months labels (income chart).
const INCOME_6_MONTHS_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

// Sum Jan–Jun this year for chart.
function aggregateJanToJun(transactions: Transaction[]) {
  const year = new Date().getFullYear();
  const buckets: Record<string, { income: number; expense: number }> = {};
  for (let m = 1; m <= 6; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    buckets[key] = { income: 0, expense: 0 };
  }
  for (const t of transactions) {
    const date = getTransactionDate(t);
    if (!date || date.getFullYear() !== year) continue;
    const month = date.getMonth() + 1;
    if (month < 1 || month > 6) continue;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    if (!buckets[key]) continue;
    if (t.amount > 0) buckets[key].income += t.amount;
    else buckets[key].expense += Math.abs(t.amount);
  }
  return { buckets };
}

// Last N month names.
function getMonthLabels(count: number): string[] {
  const labels: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
  }
  return labels;
}

// Year-month strings start to end (up to 24).
export function getYearMonthRange(startYearMonth: string, endYearMonth: string): string[] {
  const [sy, sm] = startYearMonth.split('-').map(Number);
  const [ey, em] = endYearMonth.split('-').map(Number);
  const out: string[] = [];
  let y = sy;
  let m = sm;
  const maxMonths = 24;
  while (out.length < maxMonths && (y < ey || (y === ey && m <= em))) {
    out.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

// Sum by month in range.
function aggregateByDateRange(
  transactions: Transaction[],
  startYearMonth: string,
  endYearMonth: string
) {
  const keys = getYearMonthRange(startYearMonth, endYearMonth);
  const buckets: Record<string, { income: number; expense: number }> = {};
  const labels: string[] = [];
  for (const key of keys) {
    buckets[key] = { income: 0, expense: 0 };
    const [y, m] = key.split('-').map(Number);
    labels.push(new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' }));
  }
  for (const t of transactions) {
    const date = getTransactionDate(t);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) continue;
    if (t.amount > 0) buckets[key].income += t.amount;
    else buckets[key].expense += Math.abs(t.amount);
  }
  return { buckets, labels, keys };
}

// Sum by day for cash flow.
function aggregateByDayRange(
  transactions: Transaction[],
  startYearMonth: string,
  endYearMonth: string
) {
  const [sy, sm] = startYearMonth.split('-').map(Number);
  const [ey, em] = endYearMonth.split('-').map(Number);
  
  const startDate = new Date(sy, sm - 1, 1);
  const endDate = new Date(ey, em, 0);
  
  const buckets: Record<string, { income: number; expense: number }> = {};
  const dateKeys: string[] = [];
  
  // One bucket per day
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = current.toISOString().slice(0, 10);
    buckets[key] = { income: 0, expense: 0 };
    dateKeys.push(key);
    current.setDate(current.getDate() + 1);
  }
  
  // Put tx in day bucket
  for (const t of transactions) {
    const date = getTransactionDate(t);
    if (!date) continue;
    const key = date.toISOString().slice(0, 10);
    if (!buckets[key]) continue;
    if (t.amount > 0) buckets[key].income += t.amount;
    else buckets[key].expense += Math.abs(t.amount);
  }
  
  return { buckets, dateKeys };
}

// 0–100 business health from income, expenses, savings, factors.
function computeHealthScore(
  totalIncome: number,
  totalExpense: number,
  net: number,
  monthsData: number,
  transactionCount: number,
  transactions: Transaction[]
): BusinessHealthScore {
  // Need 3+ tx or 1 month with data
  const hasMinTransactions = transactionCount >= 3;
  const hasMinData = monthsData >= 1 && (totalIncome > 0 || totalExpense > 0);
  
  if (!hasMinTransactions && !hasMinData) {
    return { score: 0, label: 'No data', message: 'Add at least 3 transactions to see your business health score.' };
  }
  
  // No income or expense at all – show “No data”
  if (monthsData >= 1 && totalIncome === 0 && totalExpense === 0) {
    return { score: 0, label: 'No data', message: 'Add income and expenses to see your business health score.' };
  }
  
  const healthAnalysis = analyzeBusinessHealth(transactions, totalIncome, totalExpense, net, monthsData);

  const avgIncome = totalIncome / monthsData;
  const avgExpense = totalExpense / monthsData;
  const savingsRate = avgIncome > 0 ? ((avgIncome - avgExpense) / avgIncome) * 100 : 0;
  const isPositive = net > 0;
  const runwayDays = avgExpense > 0 ? Math.floor((net / avgExpense) * 30) : 0;

  let score = healthAnalysis.healthScore * 0.7;
  let ruleScore = 0;
  
  // Positive cash flow
  if (isPositive && net > 100) {
    ruleScore += 40;
  } else if (isPositive) {
    ruleScore += 20;
  }
  
  // Good savings rate
  if (savingsRate > 15 && avgIncome > 1000) {
    ruleScore += 30;
  } else if (savingsRate > 5 && avgIncome > 1000) {
    ruleScore += 20;
  } else if (savingsRate > 0 && avgIncome > 1000) {
    ruleScore += 10;
  }
  
  // Runway (months of cash)
  if (runwayDays >= 60 && avgExpense > 1000) {
    ruleScore += 15;
  } else if (runwayDays >= 30 && avgExpense > 1000) {
    ruleScore += 10;
  } else if (runwayDays > 0 && avgExpense > 1000) {
    ruleScore += 5;
  }
  
  // Recent activity
  if (transactionCount >= 10) {
    ruleScore += 5;
  }

  // 70% pattern + 30% rules
  score = score + (ruleScore * 0.3);
  score = Math.min(100, Math.max(0, score));

  let label = 'Fair';
  let message = 'Keep tracking to improve.';
  if (score >= 80) {
    label = 'Excellent';
    message = 'Your business is thriving!';
  } else if (score >= 60) {
    label = 'Good';
    message = 'Your business is on track.';
  } else if (score >= 40) {
    label = 'Fair';
    message = 'Consider cutting expenses or increasing income.';
  } else if (score > 0) {
    label = 'Needs attention';
    message = 'Focus on improving cash flow.';
  } else {
    label = 'No data';
    message = 'Add more transactions to see your business health score.';
  }

  return { score, label, message };
}

// Sum by month, last N months.
function aggregateByMonth(transactions: Transaction[], monthCount: number) {
  const now = new Date();
  const buckets: Record<string, { income: number; expense: number }> = {};
  const labels = getMonthLabels(monthCount);

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    buckets[key] = { income: 0, expense: 0 };
  }

  for (const t of transactions) {
    const date = getTransactionDate(t);
    if (!date) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!buckets[key]) continue;
    if (t.amount > 0) buckets[key].income += t.amount;
    else buckets[key].expense += Math.abs(t.amount);
  }

  return { buckets, labels };
}

export function computeBusinessHealth(
  transactions: Transaction[],
  options?: { userName?: string; businessName?: string }
): BusinessHealthData {
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
  );
  const net = totalIncome - totalExpense;
  const transactionCount = transactions.length;

  const { buckets } = aggregateByMonth(transactions, 6);
  const monthsWithData = Object.values(buckets).filter((b) => b.income > 0 || b.expense > 0).length;
  const monthsForCalc = monthsWithData > 0 ? monthsWithData : 1;
  const score = computeHealthScore(totalIncome, totalExpense, net, monthsForCalc, transactionCount, transactions);

  const { buckets: janJunBuckets } = aggregateJanToJun(transactions);
  const income6Months: IncomeChartItem[] = INCOME_6_MONTHS_LABELS.map((label, i) => {
    const year = new Date().getFullYear();
    const monthNum = i + 1;
    const key = `${year}-${String(monthNum).padStart(2, '0')}`;
    const bucket = janJunBuckets[key] ?? { income: 0, expense: 0 };
    return { month: key, amount: bucket.income, label };
  });

  const prevMonthIncome = income6Months[4]?.amount ?? 0;
  const currMonthIncome = income6Months[5]?.amount ?? 0;
  const incomeChangePercent =
    prevMonthIncome > 0 ? Math.round(((currMonthIncome - prevMonthIncome) / prevMonthIncome) * 100) : 0;

  const expenseByCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const raw = t.category?.trim() || 'Other';
    const key = normalizeCategoryKey(raw);
    if (!expenseByCategory[key]) expenseByCategory[key] = 0;
    expenseByCategory[key] += Math.abs(t.amount);
  }

  const total = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
  // One row per category (normalized)
  const topSpending: TopSpendingItem[] = Object.entries(expenseByCategory)
    .map(([key, amount]) => {
      const displayName = getDisplayNameForCategoryKey(key);
      const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
      const config = getCategoryConfig(displayName);
      return { name: displayName, percent, color: config.chartColor ?? config.color };
    })
    .filter((c) => c.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  if (topSpending.length === 0) {
    topSpending.push({ name: 'Other', percent: 100, color: '#94A3B8' });
  }

  const avgIncome = monthsWithData > 0 ? totalIncome / monthsWithData : 0;
  const avgExpense = monthsWithData > 0 ? totalExpense / monthsWithData : 0;
  const savingsRate = avgIncome > 0 ? Math.round(((avgIncome - avgExpense) / avgIncome) * 100) : 0;
  const runwayDays = avgExpense > 0 ? Math.floor((net / avgExpense) * 30) : 0;

  const summary: SummaryRow[] = [
    { label: 'Cash flow', value: net >= 0 ? 'Good' : 'Negative', good: net >= 0 },
    { label: 'Savings', value: `${savingsRate}%`, good: savingsRate > 0 },
    { label: 'Runway', value: `${runwayDays} days` },
    { label: 'Income', value: `${Math.floor(avgIncome).toLocaleString()} RWF` },
    { label: 'Expense', value: `${Math.floor(avgExpense).toLocaleString()} RWF` },
  ];

  return {
    score,
    topSpending,
    income6Months,
    incomeChangePercent,
    summary,
  };
}

export function computeBusinessInsights(transactions: Transaction[]): BusinessInsightsData {
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
  );
  const net = totalIncome - totalExpense;

  const expenseByCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.amount >= 0) continue;
    const raw = t.category?.trim() || 'Other';
    const key = normalizeCategoryKey(raw);
    if (!expenseByCategory[key]) expenseByCategory[key] = 0;
    expenseByCategory[key] += Math.abs(t.amount);
  }
  const total = Object.values(expenseByCategory).reduce((a, b) => a + b, 0);
  // One row per category (normalized)
  const topSpending: TopSpendingItem[] = Object.entries(expenseByCategory)
    .map(([key, amount]) => {
      const displayName = getDisplayNameForCategoryKey(key);
      const percent = total > 0 ? Math.round((amount / total) * 100) : 0;
      const config = getCategoryConfig(displayName);
      return { name: displayName, percent, color: config.chartColor ?? config.color };
    })
    .filter((c) => c.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);

  if (topSpending.length === 0) {
    topSpending.push({ name: 'Other', percent: 100, color: '#94A3B8' });
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const dayBuckets: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    dayBuckets[d.toISOString().slice(0, 10)] = 0;
  }

  for (const t of transactions) {
    const date = getTransactionDate(t);
    if (!date || date < thirtyDaysAgo || t.amount <= 0) continue;
    const key = date.toISOString().slice(0, 10);
    if (dayBuckets[key] != null) dayBuckets[key] += t.amount;
  }

  const sortedKeys = Object.keys(dayBuckets).sort();
  const incomeTrend30Days: IncomeChartItem[] = sortedKeys.slice(-7).map((key) => {
    const d = new Date(key);
    return {
      month: key,
      amount: dayBuckets[key] ?? 0,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1),
    };
  });

  const { buckets, labels } = aggregateByMonth(transactions, 6);
  const prevMonthIncome = buckets[Object.keys(buckets).sort()[4]]?.income ?? 0;
  const currMonthIncome = buckets[Object.keys(buckets).sort()[5]]?.income ?? 0;
  const incomeChangePercent =
    prevMonthIncome > 0 ? Math.round(((currMonthIncome - prevMonthIncome) / prevMonthIncome) * 100) : 0;

  return {
    topSpending,
    incomeTrend30Days,
    incomeChangePercent,
    forecast: {
      income: Math.round(totalIncome / 6) || 0,
      expense: Math.round(totalExpense / 6) || 0,
      net: Math.round(net / 6) || 0,
    },
  };
}

/** Start and end year-month for “last N months” from today. */
export function getLastNMonthsRange(n: number): { startYearMonth: string; endYearMonth: string } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = new Date(now.getFullYear(), now.getMonth() - (n - 1), 1);
  return {
    startYearMonth: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
    endYearMonth: `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`,
  };
}

export function computeCreditReadinessForPeriod(
  transactions: Transaction[],
  userName: string,
  businessName: string,
  startYearMonth: string,
  endYearMonth: string
): CreditReadinessData {
  const { buckets, labels, keys } = aggregateByDateRange(transactions, startYearMonth, endYearMonth);
  const MONTHS = Math.max(1, keys.length);

  const { buckets: dayBuckets, dateKeys } = aggregateByDayRange(transactions, startYearMonth, endYearMonth);
  
  const MAX_PER_DAY = 999_999_999;
  const cashFlowByDay: CashFlowDayRow[] = dateKeys.map((key) => {
    const b = dayBuckets[key];
    const income = Math.min(b?.income ?? 0, MAX_PER_DAY);
    const expense = Math.min(b?.expense ?? 0, MAX_PER_DAY);
    const date = new Date(key);
    return {
      dateKey: key,
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      income,
      expense,
      net: income - expense,
    };
  });

  // From monthly buckets
  const monthlyTotals = keys.map((key) => {
    const b = buckets[key];
    return {
      income: Math.min(b?.income ?? 0, 999_999_999),
      expense: Math.min(b?.expense ?? 0, 999_999_999),
    };
  });
  
  const totalIncome = monthlyTotals.reduce((s, r) => s + r.income, 0);
  const totalExpense = monthlyTotals.reduce((s, r) => s + r.expense, 0);
  const avgIncome = totalIncome / MONTHS;
  const avgExpense = totalExpense / MONTHS;
  // Savings %
  const savingsRate = avgIncome > 0 ? Math.round(((avgIncome - avgExpense) / avgIncome) * 100) : 0;
  
  // Tx per month
  const txCountInPeriod = transactions.filter((t) => {
    const date = getTransactionDate(t);
    if (!date) return false;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return keys.includes(key);
  }).length;

  // “Good” when income >= expense
  const cashFlowStability = totalIncome >= totalExpense ? 'Good' : 'Needs improvement';
  const d1 = new Date(startYearMonth + '-01');
  const d2 = new Date(endYearMonth + '-01');
  const reportPeriodLabel = `${d1.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} – ${d2.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  const incomeVerification = { status: 'Verified', period: reportPeriodLabel };
  const businessStability = { status: 'Active', period: reportPeriodLabel };

  return {
    userName: userName || 'User',
    businessName: businessName || 'My Business',
    cashFlowStability,
    avgMonthlyIncome: Math.round(avgIncome),
    avgMonthlyExpense: Math.round(avgExpense),
    savingsRate,
    transactionFrequency: Math.round(txCountInPeriod / MONTHS),
    incomeVerification,
    businessStability,
    cashFlowByDay,
    reportPeriodLabel,
  };
}

export function computeCreditReadiness(
  transactions: Transaction[],
  userName: string,
  businessName: string
): CreditReadinessData {
  const { startYearMonth, endYearMonth } = getLastNMonthsRange(6);
  return computeCreditReadinessForPeriod(transactions, userName, businessName, startYearMonth, endYearMonth);
}
