// Real labels/notes stay on the phone; Firestore stores generic text only.

import type { PaymentMethod } from '../types/transaction';

// Generic text stored in Firestore for income
export const CLOUD_PRIVACY_LABEL_INCOME = 'Money received';
// Generic text stored in Firestore for expense
export const CLOUD_PRIVACY_LABEL_EXPENSE = 'Money sent';

/** Old names; same strings as above */
export const CLOUD_SMS_LABEL_INCOME = CLOUD_PRIVACY_LABEL_INCOME;
export const CLOUD_SMS_LABEL_EXPENSE = CLOUD_PRIVACY_LABEL_EXPENSE;

const CLOUD_SAFE_NORMALIZED = new Set(
  [
    CLOUD_PRIVACY_LABEL_INCOME,
    CLOUD_PRIVACY_LABEL_EXPENSE,
    'mobile money received',
    'mobile money sent',
    'MTN received',
    'MTN sent',
    'Airtel received',
    'Airtel sent',
  ].map((s) => s.trim().toLowerCase().replace(/\s+/g, ' '))
);

export function cloudLabelForSmsTransaction(type: 'income' | 'expense'): string {
  return type === 'income' ? CLOUD_PRIVACY_LABEL_INCOME : CLOUD_PRIVACY_LABEL_EXPENSE;
}

// SMS-backed doc id looks like: userId + "_sms_..."
export function isSmsBackedTransactionId(userId: string, transactionId: string): boolean {
  if (!userId || !transactionId) return false;
  return transactionId.startsWith(`${userId}_sms_`);
}

export function isSmsBackedTransaction(
  userId: string,
  tx: { id: string; smsId?: string | null }
): boolean {
  if (tx.smsId != null && String(tx.smsId).trim() !== '') return true;
  return isSmsBackedTransactionId(userId, tx.id);
}

/** Always true here: never put the real label/notes in Firestore as-is. */
export function shouldShieldTransactionLabelInCloud(
  _userId: string,
  _tx: { id: string; smsId?: string | null; paymentMethod?: PaymentMethod },
  _paymentMethodOverride?: PaymentMethod
): boolean {
  return true;
}

export function isCloudSafeSmsLabel(label: string | undefined | null): boolean {
  if (label == null || !String(label).trim()) return false;
  const n = String(label).trim().toLowerCase().replace(/\s+/g, ' ');
  return CLOUD_SAFE_NORMALIZED.has(n);
}
