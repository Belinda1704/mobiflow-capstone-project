// notification settings - load and save via AsyncStorage
import { useEffect, useState, useCallback } from 'react';
import { getNotificationSettings, saveNotificationSettings } from '../services/notificationSettingsService';
import type { NotificationSettings } from '../services/notificationSettingsService';

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const s = await getNotificationSettings();
      setSettings(s);
    } catch {
      setSettings({
        pushNotifications: true,
        lowBalanceAlerts: true,
        budgetAlerts: true,
        transactionAlerts: true,
        goalReminders: true,
        expenseLimitAlerts: true,
        incomeDropAlerts: true,
        marketing: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(async (partial: Partial<NotificationSettings>) => {
    try {
      const updated = await saveNotificationSettings(partial);
      setSettings(updated);
      return updated;
    } catch {
      return null;
    }
  }, []);

  return { settings, loading, update, refresh: load };
}
