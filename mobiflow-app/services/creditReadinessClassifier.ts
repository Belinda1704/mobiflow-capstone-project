// Credit verdict from report: cash flow, savings, activity (rules, no model).
import type { CreditReadinessData, CreditworthinessAssessment } from './financialInsightsService';

const WEIGHTS = {
  cashFlowGood: 0.5,
  savingsRateScale: 0.03,
  activityScale: 0.02,
};
const THRESHOLD_CREDITWORTHY = 0.75;
const THRESHOLD_NEEDS_IMPROVEMENT = 0.35;

export function predictCreditworthiness(data: CreditReadinessData): CreditworthinessAssessment {
  const { cashFlowStability, savingsRate, transactionFrequency, cashFlowByDay, avgMonthlyIncome } = data;
  const hasEnoughData = cashFlowByDay && cashFlowByDay.length >= 7;
  const hasMeaningfulIncome = avgMonthlyIncome > 0;

  if (!hasEnoughData || !hasMeaningfulIncome) {
    return {
      verdict: 'insufficient_data',
      reasonKeys: ['creditworthinessReasonInsufficientData'],
    };
  }

  const cashFlowGood = cashFlowStability === 'Good' ? 1 : 0;
  const savingsNorm = Math.max(0, Math.min(100, savingsRate)) / 100;
  const activityNorm = Math.min(1, transactionFrequency / 20);

  const score =
    WEIGHTS.cashFlowGood * cashFlowGood +
    WEIGHTS.savingsRateScale * 100 * savingsNorm +
    WEIGHTS.activityScale * 20 * activityNorm;

  if (!cashFlowGood && savingsRate < 0) {
    return {
      verdict: 'not_creditworthy',
      reasonKeys: ['creditworthinessReasonNegativeCashFlow', 'creditworthinessReasonNegativeSavings'],
    };
  }
  if (!cashFlowGood) {
    return {
      verdict: 'not_creditworthy',
      reasonKeys: ['creditworthinessReasonNegativeCashFlow'],
    };
  }
  if (savingsRate <= 0) {
    return {
      verdict: 'needs_improvement',
      reasonKeys: ['creditworthinessReasonNoSavings'],
    };
  }
  if (score >= THRESHOLD_CREDITWORTHY) {
    return {
      verdict: 'creditworthy',
      reasonKeys: ['creditworthinessReasonPositiveFlow', 'creditworthinessReasonSavingsRate'],
    };
  }
  if (score >= THRESHOLD_NEEDS_IMPROVEMENT || (savingsRate >= 10 && activityNorm > 0)) {
    return {
      verdict: 'needs_improvement',
      reasonKeys: ['creditworthinessReasonLowSavings'],
    };
  }
  return {
    verdict: 'needs_improvement',
    reasonKeys: ['creditworthinessReasonLowSavings'],
  };
}
