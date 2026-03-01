// FR-02: Manages SMS capture lifecycle - starts/stops listener based on preference and userId
import { useEffect, useState, useCallback } from 'react';
import {
  getSmsCaptureEnabled,
  setSmsCaptureEnabled,
} from '../services/preferencesService';
import {
  startSmsListener,
  stopSmsListener,
  requestSmsPermissions,
  checkSmsPermissions,
  isSmsCaptureSupported,
  updateCachedTransactions,
} from '../services/smsCaptureService';
import {
  startSmsForegroundService,
  stopSmsForegroundService,
} from '../services/smsForegroundService';
import { useTransactions } from './useTransactions';

export function useSmsCapture(userId: string | null) {
  const [enabled, setEnabledState] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Get transactions to sync with SMS capture for category suggestion
  const { transactions } = useTransactions(userId || '');

  useEffect(() => {
    let mounted = true;
    getSmsCaptureEnabled().then((v) => {
      if (mounted) setEnabledState(v);
    });
    checkSmsPermissions().then((r) => {
      if (mounted) setHasPermissions(r.hasReceiveSms && r.hasReadSms);
    });
    setLoading(false);
    return () => { mounted = false; };
  }, []);

  // Update cached transactions for category suggestion when transactions change
  useEffect(() => {
    if (userId && transactions.length > 0) {
      updateCachedTransactions(transactions);
    }
  }, [userId, transactions]);

  const toggleEnabled = useCallback(async (value: boolean) => {
    if (!isSmsCaptureSupported()) return;
    if (value && !hasPermissions) {
      const granted = await requestSmsPermissions();
      if (!granted) return;
      setHasPermissions(true);
    }
    await setSmsCaptureEnabled(value);
    setEnabledState(value);
    if (value && userId) {
      stopSmsListener();
      startSmsListener(userId);
    } else {
      stopSmsListener();
    }
  }, [userId, hasPermissions]);

  const requestPermissions = useCallback(async () => {
    const granted = await requestSmsPermissions();
    if (granted) setHasPermissions(true);
    return granted;
  }, []);

  const refreshPermissions = useCallback(async () => {
    const r = await checkSmsPermissions();
    const hasBoth = r.hasReceiveSms && r.hasReadSms;
    setHasPermissions(hasBoth);
    return hasBoth;
  }, []);

  // Start/stop listener and foreground service when userId or enabled changes.
  // Foreground service keeps the process alive so the listener receives SMS in background.
  useEffect(() => {
    if (!isSmsCaptureSupported()) {
      console.log('[useSmsCapture] SMS capture not supported on this platform');
      return;
    }
    console.log('[useSmsCapture] Effect triggered:', { userId, enabled, hasPermissions });
    if (userId && enabled && hasPermissions) {
      console.log('[useSmsCapture] Starting SMS listener and foreground service (background capture)...');
      startSmsListener(userId);
      startSmsForegroundService('MobiFlow', 'Capturing mobile money SMS in the background').catch((e) =>
        console.warn('[useSmsCapture] Foreground service start failed:', e)
      );
    } else if (!enabled) {
      console.log('[useSmsCapture] Stopping SMS listener and foreground service (user disabled)');
      stopSmsListener();
      stopSmsForegroundService();
    }
  }, [userId, enabled, hasPermissions]);

  return {
    supported: isSmsCaptureSupported(),
    enabled,
    hasPermissions,
    loading,
    toggleEnabled,
    requestPermissions,
    refreshPermissions,
  };
}
