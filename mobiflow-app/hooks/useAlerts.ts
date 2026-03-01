// alert settings - load and save via service
import { useEffect, useState, useCallback } from 'react';
import { getAlertSettings, saveAlertSettings, DEFAULT_ALERTS } from '../services/alertsService';
import type { AlertSettings } from '../services/alertsService';
import { showError } from '../services/errorPresenter';

export function useAlerts(userId: string | null) {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setSettings(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const s = await getAlertSettings(userId);
      setSettings(s);
    } catch {
      // Use defaults so the page still works (e.g. offline or first load); user can save to create doc
      setSettings(DEFAULT_ALERTS);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const update = useCallback(
    async (partial: Partial<AlertSettings>) => {
      if (!userId || !settings) return null;
      try {
        const updated = await saveAlertSettings(userId, { ...settings, ...partial });
        setSettings(updated);
        return updated;
      } catch {
        showError('Error', 'Could not save alert settings.');
        return null;
      }
    },
    [userId, settings]
  );

  return { settings, loading, update, refresh: load };
}
