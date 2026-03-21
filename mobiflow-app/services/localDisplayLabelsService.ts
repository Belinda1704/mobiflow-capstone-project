import AsyncStorage from '@react-native-async-storage/async-storage';

type DisplayLabelsMap = Record<string, string>;

const KEY_PREFIX = '@mobiflow/displayLabels_';

// In-memory cache so UI updates immediately after SMS capture.
const inMemoryCache: Record<string, DisplayLabelsMap> = {};

async function ensureLoaded(userId: string): Promise<void> {
  if (!userId) return;
  if (inMemoryCache[userId]) return;

  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${userId}`);
    const parsed = raw ? (JSON.parse(raw) as DisplayLabelsMap) : {};
    inMemoryCache[userId] = parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    inMemoryCache[userId] = {};
  }
}

export async function saveDisplayLabel(
  userId: string,
  transactionId: string,
  displayLabel: string
): Promise<void> {
  if (!userId || !transactionId) return;
  if (!displayLabel) return;

  await ensureLoaded(userId);
  inMemoryCache[userId][transactionId] = displayLabel;

  // Persist so the user still sees names after app restart.
  await AsyncStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(inMemoryCache[userId])).catch(() => {});
}

export function getDisplayLabel(userId: string, transactionId: string): string | undefined {
  const map = inMemoryCache[userId];
  return map ? map[transactionId] : undefined;
}

export async function hydrateDisplayLabels(userId: string): Promise<void> {
  await ensureLoaded(userId);
}

export function applyDisplayLabels<T extends { id: string }>(
  userId: string,
  transactions: T[]
): Array<T & { displayLabel?: string }> {
  const map = inMemoryCache[userId] || {};
  return transactions.map((tx) => {
    const displayLabel = map[tx.id];
    if (!displayLabel) return tx as T & { displayLabel?: string };
    return { ...(tx as T), displayLabel };
  });
}

