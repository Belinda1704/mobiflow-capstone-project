// Notification prefs in AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@mobiflow/notificationSettings';

export type NotificationSettings = {
  pushNotifications: boolean;
  lowBalanceAlerts: boolean;
  budgetAlerts: boolean;
  transactionAlerts: boolean;
  goalReminders: boolean;
  expenseLimitAlerts: boolean;
  incomeDropAlerts: boolean;
  marketing: boolean;
};

const DEFAULTS: NotificationSettings = {
  pushNotifications: true,
  lowBalanceAlerts: true,
  budgetAlerts: true,
  transactionAlerts: true,
  goalReminders: true,
  expenseLimitAlerts: true,
  incomeDropAlerts: true,
  marketing: false,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const data = JSON.parse(raw);
    return {
      pushNotifications: data.pushNotifications !== false,
      lowBalanceAlerts: data.lowBalanceAlerts !== false,
      budgetAlerts: data.budgetAlerts !== false,
      transactionAlerts: data.transactionAlerts !== false,
      goalReminders: data.goalReminders !== false,
      expenseLimitAlerts: data.expenseLimitAlerts !== false,
      incomeDropAlerts: data.incomeDropAlerts !== false,
      marketing: data.marketing === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveNotificationSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
  const current = await getNotificationSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
