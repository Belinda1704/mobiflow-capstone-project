// Budget suggestions from past spending (averages + trend). Also savings goal suggestion = 10% of last month income.
import type { Transaction } from '../types/transaction';
import { getTransactionDate } from './transactionDate';

// 10% of last month's income for the savings goal screen
export function getSuggestedSavingsGoal(transactions: Transaction[]): { amount: number; reasoning: string } | null {
  const now = new Date();
  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  let income = 0;
  for (const t of transactions) {
    if (t.amount <= 0) continue;
    const d = getTransactionDate(t);
    if (d && d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear) income += t.amount;
  }
  if (income <= 0) return null;
  const amount = Math.round(income * 0.1);
  return { amount, reasoning: '10% of last month\'s income' };
}

export type SuggestedBudget = {
  category: string;
  suggestedAmount: number;
  avgSpend: number;
  trend?: 'increasing' | 'decreasing' | 'stable';
  confidence?: number;
  reasoning?: string;
};

export function computeSuggestedBudgets(transactions: Transaction[]): SuggestedBudget[] {
  const expenseTx = transactions.filter((t) => t.amount < 0);
  if (expenseTx.length === 0) return [];

  const byCategoryMonth: Record<string, Record<string, number>> = {};
  let minDate: Date | null = null;
  let maxDate: Date | null = null;

  for (const t of expenseTx) {
    const amt = Math.abs(t.amount);
    const cat = (t.category ?? 'Other').trim() || 'Other';
    const date = getTransactionDate(t);
    
    if (date) {
      if (!minDate || date < minDate) minDate = date;
      if (!maxDate || date < maxDate) maxDate = date;
      
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!byCategoryMonth[cat]) byCategoryMonth[cat] = {};
      byCategoryMonth[cat][monthKey] = (byCategoryMonth[cat][monthKey] || 0) + amt;
    }
  }

  const months = minDate && maxDate
    ? Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (30 * 24 * 60 * 60 * 1000)))
    : 1;

  const result: SuggestedBudget[] = [];
  
  for (const [category, monthlyData] of Object.entries(byCategoryMonth)) {
    const monthlyAmounts = Object.values(monthlyData);
    const total = monthlyAmounts.reduce((a, b) => a + b, 0);
    
    if (total <= 0) continue;

    const avgSpend = Math.round(total / months);
    
    const trend = analyzeSpendingTrend(monthlyAmounts);
    let suggestedAmount: number;
    let reasoning: string;
    let confidence: number;

    if (monthlyAmounts.length >= 3) {
      if (trend === 'increasing') {
        suggestedAmount = Math.ceil(avgSpend * 1.2);
        reasoning = 'Spending going up so suggest higher budget';
        confidence = 0.8;
      } else if (trend === 'decreasing') {
        suggestedAmount = Math.ceil(avgSpend * 1.05);
        reasoning = 'Spending going down so suggest lower';
        confidence = 0.8;
      } else {
        suggestedAmount = Math.ceil(avgSpend * 1.1);
        reasoning = 'Stable spending, average + 10% buffer';
        confidence = 0.9;
      }
    } else {
      suggestedAmount = Math.ceil(avgSpend * 1.1);
      reasoning = 'Based on average spending with 10% buffer';
      confidence = 0.6;
    }

    result.push({
      category,
      suggestedAmount,
      avgSpend,
      trend,
      confidence,
      reasoning,
    });
  }
  
  return result.sort((a, b) => b.avgSpend - a.avgSpend).slice(0, 10);
}

function analyzeSpendingTrend(monthlyAmounts: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (monthlyAmounts.length < 3) return 'stable';

  // Simple slope (linear regression)
  const n = monthlyAmounts.length;
  const x = Array.from({ length: n }, (_, i) => i + 1);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = monthlyAmounts.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * monthlyAmounts[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const avgAmount = sumY / n;

  const threshold = avgAmount * 0.05;
  
  if (slope > threshold) return 'increasing';
  if (slope < -threshold) return 'decreasing';
  return 'stable';
}
