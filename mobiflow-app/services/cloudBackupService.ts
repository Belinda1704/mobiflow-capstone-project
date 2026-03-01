// Cloud backup: upload, list, download (Firebase Storage).
import { ref, uploadString, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

const BACKUP_PREFIX = 'backups';

function backupPath(userId: string, filename?: string): string {
  if (filename) return `${BACKUP_PREFIX}/${userId}/${filename}`;
  return `${BACKUP_PREFIX}/${userId}`;
}

// Upload backup JSON to user folder; return download URL.
export async function uploadBackupToCloud(
  userId: string,
  jsonContent: string,
  filename?: string
): Promise<string> {
  const name = filename || `mobiflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const path = backupPath(userId, name);
  const storageRef = ref(storage, path);
  await uploadString(storageRef, jsonContent, 'raw');
  return getDownloadURL(storageRef);
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
  const url = await getDownloadURL(storageRef);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Download failed');
  return res.text();
}

// Delete backup by path.
export async function deleteCloudBackup(fullPath: string): Promise<void> {
  const storageRef = ref(storage, fullPath);
  await deleteObject(storageRef);
}
