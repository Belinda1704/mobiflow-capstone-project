// financialInsightsService: creditworthiness + getLastNMonthsRange
import {
  assessCreditworthiness,
  getLastNMonthsRange,
  type CreditReadinessData,
} from '../../services/financialInsightsService';

function minimalData(overrides: Partial<CreditReadinessData> = {}): CreditReadinessData {
  const base: CreditReadinessData = {
    userName: 'Test',
    businessName: 'Biz',
    cashFlowStability: 'Good',
    avgMonthlyIncome: 500000,
    avgMonthlyExpense: 300000,
    savingsRate: 25,
    transactionFrequency: 15,
    incomeVerification: { status: 'verified', period: 'Last 6 months' },
    businessStability: { status: 'active', period: '12 months active' },
    cashFlowByDay: Array.from({ length: 14 }, (_, i) => ({
      dateKey: `2025-01-${String(i + 1).padStart(2, '0')}`,
      dateLabel: `Jan ${i + 1}`,
      income: 10000,
      expense: 6000,
      net: 4000,
    })),
    reportPeriodLabel: 'Jan 2025 – Feb 2025',
  };
  return { ...base, ...overrides };
}

describe('financialInsightsService', () => {
  describe('assessCreditworthiness', () => {
    describe('Insufficient data', () => {
      it('returns insufficient_data when cashFlowByDay has fewer than 7 days', () => {
        const data = minimalData({
          cashFlowByDay: Array.from({ length: 5 }, (_, i) => ({
            dateKey: `2025-01-${i + 1}`,
            dateLabel: `Day ${i + 1}`,
            income: 5000,
            expense: 3000,
            net: 2000,
          })),
        });
        const result = assessCreditworthiness(data);
        expect(result.verdict).toBe('insufficient_data');
        expect(result.reasonKeys).toContain('creditworthinessReasonInsufficientData');
      });

      it('returns insufficient_data when avgMonthlyIncome is zero', () => {
        const data = minimalData({ avgMonthlyIncome: 0 });
        const result = assessCreditworthiness(data);
        expect(result.verdict).toBe('insufficient_data');
      });
    });

    describe('Not creditworthy', () => {
      it('returns not_creditworthy when cash flow is bad and savings is negative', () => {
        const data = minimalData({
          cashFlowStability: 'Poor',
          savingsRate: -5,
        });
        const result = assessCreditworthiness(data);
        expect(result.verdict).toBe('not_creditworthy');
        expect(result.reasonKeys).toEqual(
          expect.arrayContaining(['creditworthinessReasonNegativeCashFlow', 'creditworthinessReasonNegativeSavings'])
        );
      });

      it('returns not_creditworthy when cash flow is bad only', () => {
        const data = minimalData({ cashFlowStability: 'Poor', savingsRate: 5 });
        const result = assessCreditworthiness(data);
        expect(result.verdict).toBe('not_creditworthy');
        expect(result.reasonKeys).toContain('creditworthinessReasonNegativeCashFlow');
      });
    });

    describe('Needs improvement', () => {
      it('returns needs_improvement when savings rate is zero', () => {
        const data = minimalData({ savingsRate: 0 });
        const result = assessCreditworthiness(data);
        expect(result.verdict).toBe('needs_improvement');
        expect(result.reasonKeys).toContain('creditworthinessReasonNoSavings');
      });

      it('returns needs_improvement when savings rate is positive but below 10%', () => {
        const data = minimalData({ savingsRate: 5, transactionFrequency: 2 });
        const result = assessCreditworthiness(data);
        expect(result.verdict).toBe('needs_improvement');
        expect(result.reasonKeys).toContain('creditworthinessReasonLowSavings');
      });
    });

    describe('Creditworthy', () => {
      it('returns creditworthy when data is strong (good flow, savings >= 10%, activity)', () => {
        const data = minimalData({
          cashFlowStability: 'Good',
          savingsRate: 15,
          transactionFrequency: 20,
        });
        const result = assessCreditworthiness(data);
        expect(result.verdict).toBe('creditworthy');
        expect(result.reasonKeys).toEqual(
          expect.arrayContaining(['creditworthinessReasonPositiveFlow', 'creditworthinessReasonSavingsRate'])
        );
      });

      it('returns creditworthy with high savings and high activity', () => {
        const data = minimalData({ savingsRate: 30, transactionFrequency: 50 });
        const result = assessCreditworthiness(data);
        expect(result.verdict).toBe('creditworthy');
      });
    });
  });

  describe('getLastNMonthsRange', () => {
    describe('Format and range', () => {
      it('returns startYearMonth and endYearMonth in YYYY-MM format', () => {
        const result = getLastNMonthsRange(6);
        expect(result).toHaveProperty('startYearMonth');
        expect(result).toHaveProperty('endYearMonth');
        expect(result.startYearMonth).toMatch(/^\d{4}-\d{2}$/);
        expect(result.endYearMonth).toMatch(/^\d{4}-\d{2}$/);
      });

      it('returns same month for n=1', () => {
        const result = getLastNMonthsRange(1);
        expect(result.startYearMonth).toBe(result.endYearMonth);
      });

      it('returns different start and end for n=6', () => {
        const result = getLastNMonthsRange(6);
        expect(result.startYearMonth).not.toBe(result.endYearMonth);
      });
    });
  });
});
