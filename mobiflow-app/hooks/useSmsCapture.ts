// SMS capture on/off and listener start/stop from preference and userId
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
      startSmsListener(userId, undefined, undefined, false);
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

  // Start or stop listener when enabled or userId changes
  useEffect(() => {
    if (!isSmsCaptureSupported()) {
      console.log('[useSmsCapture] SMS capture not supported on this platform');
      return;
    }
    console.log('[useSmsCapture] Effect triggered:', { userId, enabled, hasPermissions });
    if (userId && enabled && hasPermissions) {
      console.log('[useSmsCapture] Starting SMS listener...');
      startSmsListener(userId, undefined, undefined, false);
      // Foreground service off (manifest type mismatch). Listener still works when app is open.
    } else if (!enabled) {
      console.log('[useSmsCapture] Stopping SMS listener (user disabled)');
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
