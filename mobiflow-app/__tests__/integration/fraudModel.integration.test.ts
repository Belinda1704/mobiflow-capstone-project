import { computeFraudRiskForTransaction, isHighFraudRisk } from '../../utils/fraudModel';
import type { Transaction } from '../../types/transaction';

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    userId: 'user1',
    label: 'Test tx',
    amount: 10_000,
    type: 'expense',
    category: 'Other',
    paymentMethod: 'mobile_money',
    createdAt: new Date('2026-02-01T10:00:00Z'),
    smsId: null,
    notes: '',
    ...overrides,
  } as Transaction;
}

describe('Fraud model integration', () => {
  it('returns zero risk for non-expense transactions', () => {
    const incomeTx = makeTx({ type: 'income' });
    const risk = computeFraudRiskForTransaction(incomeTx);
    expect(risk).toBe(0);
  });

  it('flags extremely large mobile_money expenses as high risk', () => {
    const largeExpense = makeTx({
      amount: 50_000_000, // 50M RWF to stress the model
      type: 'expense',
      paymentMethod: 'mobile_money',
    });
    const risk = computeFraudRiskForTransaction(largeExpense);
    expect(risk).toBeGreaterThan(0.98);
    expect(isHighFraudRisk(largeExpense)).toBe(true);
  });

  it('keeps small cash expenses as low risk', () => {
    const smallCashExpense = makeTx({
      amount: 1_000,
      type: 'expense',
      paymentMethod: 'cash',
    });
    const risk = computeFraudRiskForTransaction(smallCashExpense);
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThan(0.5);
    expect(isHighFraudRisk(smallCashExpense)).toBe(false);
  });
});

