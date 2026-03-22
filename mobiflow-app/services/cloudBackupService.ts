// Cloud backup: upload, list, download (Firebase Storage). Monthly report PDF upload.
import { ref, uploadString, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';
import { withTimeout } from '../utils/withTimeout';

// Max wait for Storage calls so the UI does not hang.
const STORAGE_UPLOAD_MS = 90000;
const STORAGE_LIST_MS = 30000;
const STORAGE_DOWNLOAD_MS = 60000;

const BACKUP_PREFIX = 'backups';
const MONTHLY_REPORTS_PREFIX = 'monthly-reports';

function backupPath(userId: string, filename?: string): string {
  if (filename) return `${BACKUP_PREFIX}/${userId}/${filename}`;
  return `${BACKUP_PREFIX}/${userId}`;
}

// Upload backup JSON to user folder (no extra getDownloadURL — saves a round trip vs Storage).
export async function uploadBackupToCloud(
  userId: string,
  jsonContent: string,
  filename?: string
): Promise<void> {
  const name = filename || `mobiflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const path = backupPath(userId, name);
  const storageRef = ref(storage, path);
  await withTimeout(uploadString(storageRef, jsonContent, 'raw'), STORAGE_UPLOAD_MS);
}

export type CloudBackupItem = {
  name: string;
  fullPath: string;
  createdAt: number;
};

// List backup files (newest first).
export async function listCloudBackups(userId: string): Promise<CloudBackupItem[]> {
  const listRef = ref(storage, backupPath(userId));
  const result = await listAll(listRef);
  const items: CloudBackupItem[] = result.items.map((item) => ({
    name: item.name,
    fullPath: item.fullPath,
    createdAt: 0,
  }));
  // Newest first
  items.sort((a, b) => (a.name > b.name ? -1 : 1));
  return items;
}

// Download backup, return JSON string.
export async function downloadBackupFromCloud(fullPath: string): Promise<string> {
  const storageRef = ref(storage, fullPath);
  const url = await withTimeout(getDownloadURL(storageRef), STORAGE_DOWNLOAD_MS);
  const res = await withTimeout(fetch(url), STORAGE_DOWNLOAD_MS);
  if (!res.ok) throw new Error('Download failed');
  return res.text();
}

// Delete backup by path.
export async function deleteCloudBackup(fullPath: string): Promise<void> {
  const storageRef = ref(storage, fullPath);
  await withTimeout(deleteObject(storageRef), STORAGE_LIST_MS);
}

/** Upload monthly report PDF (base64) to Storage. monthKey = YYYY-MM. */
export async function uploadMonthlyReportPdf(
  userId: string,
  monthKey: string,
  base64Content: string
): Promise<string> {
  const path = `${MONTHLY_REPORTS_PREFIX}/${userId}/${monthKey}.pdf`;
  const storageRef = ref(storage, path);
  await withTimeout(uploadString(storageRef, base64Content, 'base64'), STORAGE_UPLOAD_MS);
  return withTimeout(getDownloadURL(storageRef), STORAGE_LIST_MS);
}
