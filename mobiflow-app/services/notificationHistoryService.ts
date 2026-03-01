// Recent in-app notifications (Settings > Notifications list).
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@mobiflow/notificationHistory/';
const MAX_ITEMS = 50;

export type NotificationHistoryType = 'lowBalance' | 'budgetOverspent' | 'transactionCompleted' | 'goalReminder' | 'expenseLimit' | 'incomeDrop';

export type NotificationHistoryItem = {
  id: string;
  type: NotificationHistoryType;
  title: string;
  details: string;
  timestamp: string; // ISO date string
};

function storageKey(userId: string): string {
  return `${KEY_PREFIX}${userId}`;
}

export async function getRecentNotifications(userId: string): Promise<NotificationHistoryItem[]> {
  if (!userId) return [];
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const arr = JSON.parse(raw) as NotificationHistoryItem[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function addToNotificationHistory(
  userId: string,
  item: Omit<NotificationHistoryItem, 'id' | 'timestamp'>
): Promise<void> {
  if (!userId) return;
  try {
    const list = await getRecentNotifications(userId);
    const entry: NotificationHistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    const next = [entry, ...list].slice(0, MAX_ITEMS);
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch (e) {
    console.warn('Failed to add to notification history:', e);
  }
}
