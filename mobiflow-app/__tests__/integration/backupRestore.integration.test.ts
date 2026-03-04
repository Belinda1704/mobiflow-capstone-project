// backup/restore: parse JSON, build inputs, roundtrip
import {
  parseBackupJson,
  backupToTransactionInputs,
  buildBackupData,
} from '../../services/backupRestoreService';
import type { Transaction } from '../../types/transaction';

function mockTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'id1',
    userId: 'u1',
    label: 'Sale',
    amount: 5000,
    type: 'income',
    category: 'Other',
    paymentMethod: 'mobile_money',
    createdAt: new Date('2026-02-01T10:00:00Z'),
    ...overrides,
  } as Transaction;
}

describe('Backup/Restore integration', () => {
  it('parseBackupJson then backupToTransactionInputs returns valid inputs', () => {
    const json = JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions: [
        { label: 'Income', amount: 10000, type: 'income', category: 'Sales', createdAt: '2026-02-01T10:00:00Z' },
        { label: 'Rent', amount: 50000, type: 'expense', category: 'Rent', createdAt: '2026-02-02T09:00:00Z' },
      ],
    });
    const parsed = parseBackupJson(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const inputs = backupToTransactionInputs(parsed.data);
    expect(inputs).toHaveLength(2);
    expect(inputs[0].label).toBe('Income');
    expect(inputs[0].amount).toBe(10000);
    expect(inputs[1].type).toBe('expense');
  });

  it('parseBackupJson rejects invalid JSON', () => {
    const result = parseBackupJson('not json');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeDefined();
  });

  it('parseBackupJson rejects missing version', () => {
    const result = parseBackupJson(JSON.stringify({ transactions: [] }));
    expect(result.ok).toBe(false);
  });

  it('buildBackupData then parseBackupJson roundtrip preserves data', () => {
    const transactions = [mockTx({ label: 'Test', amount: 3000 })];
    const backup = buildBackupData(transactions, { displayName: 'User' });
    const json = JSON.stringify(backup);
    const parsed = parseBackupJson(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.transactions).toHaveLength(1);
    expect(parsed.data.transactions[0].label).toBe('Test');
    expect(parsed.data.settings?.displayName).toBe('User');
  });

  it('backupToTransactionInputs filters out zero-amount transactions', () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      transactions: [
        { label: 'Valid', amount: 100, type: 'income', category: 'Other' },
        { label: 'Zero', amount: 0, type: 'income', category: 'Other' },
      ],
    };
    const inputs = backupToTransactionInputs(data as any);
    expect(inputs).toHaveLength(1);
    expect(inputs[0].label).toBe('Valid');
  });
});
