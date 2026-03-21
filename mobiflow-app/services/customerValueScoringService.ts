// Customer value score: value, frequency, recency, consistency (formula, not ML).

import type { CustomerScore } from './customerIdentificationService';
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';

export type CustomerValueScore = CustomerScore & {
  valueScore: number; // 0-100 weighted score
  valueTier: 'high' | 'medium' | 'low';
  factors: {
    totalValue: number; // 0-40 points
    frequency: number; // 0-30 points
    recency: number; // 0-20 points
    consistency: number; // 0-10 points
  };
};

// Score from total amount, frequency, recency, consistency.
export function computeCustomerValueScore(
  customer: CustomerScore,
  allTransactions: Transaction[]
): CustomerValueScore {
  // Factor 1: total value (0–40)
  const incomeTransactions = allTransactions.filter((t) => t.amount > 0);
  const amounts = incomeTransactions.map((t) => Math.abs(t.amount)).sort((a, b) => b - a);
  const top10Percentile = amounts[Math.floor(amounts.length * 0.1)] || amounts[0] || 1;
  const valueScore = Math.min(40, (customer.totalAmount / top10Percentile) * 40);

  // Factor 2: Frequency (0-30 points)
  // More transactions = higher score (up to 30 points)
  const maxFrequency = Math.max(...allTransactions.map(() => 1).reduce((acc, _, i) => {
    const phone = extractPhone(allTransactions[i]);
    return phone ? [...acc, countTransactionsForPhone(allTransactions, phone)] : acc;
  }, [] as number[])) || 1;
  const frequencyScore = Math.min(30, (customer.transactionCount / maxFrequency) * 30);

  // Factor 3: recency (0–20)
  const daysSinceLastTransaction = customer.lastTransactionDate
    ? Math.floor((Date.now() - customer.lastTransactionDate.getTime()) / (1000 * 60 * 60 * 24))
    : 365;
  const recencyScore = Math.max(0, 20 - (daysSinceLastTransaction / 30) * 20); // Decay over 30 days

  // Factor 4: consistency (0–10)
  const customerTxs = allTransactions.filter((t) => {
    const phone = extractPhone(t);
    return phone === customer.phone && t.amount > 0;
  });
  const consistencyScore = calculateConsistency(customerTxs);

  // Total 0–100
  const totalScore = Math.round(valueScore + frequencyScore + recencyScore + consistencyScore);

  // Tier
  let valueTier: 'high' | 'medium' | 'low';
  if (totalScore >= 70) valueTier = 'high';
  else if (totalScore >= 40) valueTier = 'medium';
  else valueTier = 'low';

  return {
    ...customer,
    valueScore: totalScore,
    valueTier,
    factors: {
      totalValue: Math.round(valueScore),
      frequency: Math.round(frequencyScore),
      recency: Math.round(recencyScore),
      consistency: Math.round(consistencyScore),
    },
  };
}

function extractPhone(tx: Transaction): string | null {
  // Parentheses required when mixing `??` and `||` in TS/JS parsing.
  const label = (tx.displayLabel ?? tx.label) || '';
  const match = label.match(/(?:from|to)\s+(\d{9,10})/i);
  return match ? match[1] : null;
}

function countTransactionsForPhone(transactions: Transaction[], phone: string): number {
  return transactions.filter((t) => {
    const txPhone = extractPhone(t);
    return txPhone === phone && t.amount > 0;
  }).length;
}

function calculateConsistency(transactions: Transaction[]): number {
  if (transactions.length < 2) return 0;

  // Variance in intervals
  const dates = transactions
    .map((t) => getTransactionDate(t))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  if (dates.length < 2) return 0;

  const intervals: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const days = Math.floor((dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24));
    intervals.push(days);
  }

  if (intervals.length === 0) return 0;

  // Lower variance = higher
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
  const stdDev = Math.sqrt(variance);

  // Lower std dev = higher (max 10)
  const consistencyScore = Math.max(0, 10 - (stdDev / avgInterval) * 10);
  return Math.min(10, consistencyScore);
}
