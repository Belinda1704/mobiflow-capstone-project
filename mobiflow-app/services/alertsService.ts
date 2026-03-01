// Alert thresholds (low balance, expense limit) in Firestore.
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '../config/firebase';

export type AlertSettings = {
  lowBalanceThreshold: number;
  expenseLimitMonthly: number;
  notifyOnLowBalance: boolean;
  notifyOnExpenseLimit: boolean;
};

export const DEFAULT_ALERTS: AlertSettings = {
  lowBalanceThreshold: 100000,
  expenseLimitMonthly: 500000,
  notifyOnLowBalance: true,
  notifyOnExpenseLimit: true,
};

const SETTINGS_COLLECTION = 'userSettings';

async function getSettingsRef(userId: string) {
  return doc(db, SETTINGS_COLLECTION, userId);
}

export async function getAlertSettings(userId: string): Promise<AlertSettings> {
  if (!userId) return DEFAULT_ALERTS;
  const ref = await getSettingsRef(userId);
  const snap = await getDoc(ref);
  const data = snap.data();
  const raw = data?.alertSettings;
  if (!raw || typeof raw !== 'object') return DEFAULT_ALERTS;
  return {
    lowBalanceThreshold: typeof raw.lowBalanceThreshold === 'number' ? raw.lowBalanceThreshold : DEFAULT_ALERTS.lowBalanceThreshold,
    expenseLimitMonthly: typeof raw.expenseLimitMonthly === 'number' ? raw.expenseLimitMonthly : DEFAULT_ALERTS.expenseLimitMonthly,
    notifyOnLowBalance: raw.notifyOnLowBalance !== false,
    notifyOnExpenseLimit: raw.notifyOnExpenseLimit !== false,
  };
}

export async function saveAlertSettings(userId: string, settings: Partial<AlertSettings>): Promise<AlertSettings> {
  const current = await getAlertSettings(userId);
  const updated: AlertSettings = {
    ...current,
    ...settings,
  };
  const ref = await getSettingsRef(userId);
  await setDoc(ref, { alertSettings: updated }, { merge: true });
  return updated;
}
