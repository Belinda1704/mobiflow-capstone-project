// Backup/restore: export import transactions and settings as JSON.
import type { Transaction } from '../types/transaction';
import type { CreateTransactionInput } from '../types/transaction';
import { getTransactionDate } from '../utils/transactionDate';

export type BackupSettings = {
  displayName?: string;
  businessName?: string;
  businessType?: string;
};

export type BackupData = {
  version: number;
  exportedAt: string;
  transactions: Array<{
    label: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    paymentMethod?: string;
    notes?: string;
    createdAt?: string;
  }>;
  settings?: BackupSettings;
};

const BACKUP_VERSION = 1;

// Build backup object (transactions + settings) for JSON.
export function buildBackupData(
  transactions: Transaction[],
  settings?: BackupSettings
): BackupData {
  const txExport = transactions.map((t) => {
    const date = getTransactionDate(t);
    return {
      label: t.label,
      amount: Math.abs(t.amount),
      type: t.type,
      category: t.category ?? 'Other',
      paymentMethod: t.paymentMethod,
      notes: t.notes,
      createdAt: date ? date.toISOString() : undefined,
    };
  });
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    transactions: txExport,
    settings,
  };
}

// Turn backup back into list for Firestore.
export function backupToTransactionInputs(data: BackupData): CreateTransactionInput[] {
  if (!data.transactions || !Array.isArray(data.transactions)) return [];
  return data.transactions
    .map((tx): CreateTransactionInput => ({
      label: String(tx.label ?? '').trim() || 'Imported',
      amount: Math.abs(Number(tx.amount) || 0),
      type: tx.type === 'income' ? 'income' : 'expense',
      category: String(tx.category ?? 'Other').trim() || 'Other',
      paymentMethod: tx.paymentMethod === 'cash' ? 'cash' : 'mobile_money',
      notes: tx.notes ? String(tx.notes).trim() : undefined,
      createdAt: tx.createdAt ? new Date(tx.createdAt) : undefined,
      smsId: null,
    }))
    .filter((t) => t.amount > 0);
}

export type ParseBackupResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: string };

// Parse backup file, check shape (version, transactions).
export function parseBackupJson(jsonStr: string): ParseBackupResult {
  try {
    const parsed = JSON.parse(jsonStr) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'Invalid backup file.' };
    }
    const obj = parsed as Record<string, unknown>;
    if (!obj.version || typeof obj.version !== 'number') {
      return { ok: false, error: 'Invalid backup format: missing version.' };
    }
    if (!Array.isArray(obj.transactions)) {
      return { ok: false, error: 'Invalid backup format: missing transactions array.' };
    }
    const data: BackupData = {
      version: obj.version as number,
      exportedAt: (obj.exportedAt as string) ?? new Date().toISOString(),
      transactions: obj.transactions as BackupData['transactions'],
      settings: obj.settings as BackupSettings | undefined,
    };
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Failed to parse backup file.',
    };
  }
}
