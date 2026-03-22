// Full note text on device only (Firestore `notes` stays empty for privacy).
import AsyncStorage from '@react-native-async-storage/async-storage';

type DisplayNotesMap = Record<string, string>;

const KEY_PREFIX = '@mobiflow/displayNotes_';

const inMemoryCache: Record<string, DisplayNotesMap> = {};

async function ensureLoaded(userId: string): Promise<void> {
  if (!userId) return;
  if (inMemoryCache[userId]) return;

  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${userId}`);
    const parsed = raw ? (JSON.parse(raw) as DisplayNotesMap) : {};
    inMemoryCache[userId] = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    inMemoryCache[userId] = {};
  }
}

export async function saveDisplayNote(
  userId: string,
  transactionId: string,
  displayNote: string
): Promise<void> {
  if (!userId || !transactionId) return;
  await ensureLoaded(userId);
  const trimmed = displayNote.trim();
  if (!trimmed) {
    delete inMemoryCache[userId][transactionId];
  } else {
    inMemoryCache[userId][transactionId] = trimmed;
  }
  await AsyncStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(inMemoryCache[userId])).catch(() => {});
}

export async function hydrateDisplayNotes(userId: string): Promise<void> {
  await ensureLoaded(userId);
}

export async function removeDisplayNote(userId: string, transactionId: string): Promise<void> {
  if (!userId || !transactionId) return;
  await ensureLoaded(userId);
  const map = inMemoryCache[userId];
  if (map && map[transactionId]) {
    delete map[transactionId];
    await AsyncStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(map)).catch(() => {});
  }
}

export async function removeDisplayNotesForIds(userId: string, transactionIds: string[]): Promise<void> {
  if (!userId || transactionIds.length === 0) return;
  await ensureLoaded(userId);
  const map = inMemoryCache[userId];
  if (!map) return;
  let changed = false;
  for (const id of transactionIds) {
    if (map[id]) {
      delete map[id];
      changed = true;
    }
  }
  if (changed) {
    await AsyncStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(map)).catch(() => {});
  }
}

export async function clearDisplayNotesForUser(userId: string): Promise<void> {
  if (!userId) return;
  delete inMemoryCache[userId];
  await AsyncStorage.removeItem(`${KEY_PREFIX}${userId}`).catch(() => {});
}

export function applyDisplayNotes<T extends { id: string }>(
  userId: string,
  transactions: T[]
): Array<T & { displayNotes?: string }> {
  const map = inMemoryCache[userId] || {};
  return transactions.map((tx) => {
    const displayNotes = map[tx.id];
    if (!displayNotes) return tx as T & { displayNotes?: string };
    return { ...(tx as T), displayNotes };
  });
}
