// Automated daily backup: run cloud backup when app is opened if last backup was > 24h ago.
import type { Transaction } from '../types/transaction';
import type { BackupSettings } from './backupRestoreService';
import { buildBackupData } from './backupRestoreService';
import { uploadBackupToCloud } from './cloudBackupService';
import {
  getLastAutomatedBackupAt,
  setLastAutomatedBackupAt,
  getAutomatedBackupEnabled,
} from './preferencesService';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// Run cloud backup if enabled and last backup was over 24h ago. No popups on success or fail.
export async function runAutomatedBackupIfDue(
  userId: string,
  transactions: Transaction[],
  settings?: BackupSettings
): Promise<boolean> {
  const enabled = await getAutomatedBackupEnabled();
  if (!enabled) return false;

  const lastAt = await getLastAutomatedBackupAt();
  const now = Date.now();
  if (lastAt) {
    const lastMs = new Date(lastAt).getTime();
    if (now - lastMs < TWENTY_FOUR_HOURS_MS) return false;
  }

  try {
    const backup = buildBackupData(transactions, settings);
    const json = JSON.stringify(backup, null, 2);
    await uploadBackupToCloud(userId, json);
    await setLastAutomatedBackupAt(new Date().toISOString());
    return true;
  } catch {
    return false;
  }
}
