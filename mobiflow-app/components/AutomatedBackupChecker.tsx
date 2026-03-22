// Runs automated cloud backup when app is opened or returns to foreground, if last backup was > 24h ago.
import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactions } from '../hooks/useTransactions';
import { runAutomatedBackupIfDue } from '../services/automatedBackupService';
import {
  getDisplayName,
  getBusinessName,
  getBusinessType,
} from '../services/preferencesService';

export function AutomatedBackupChecker() {
  const { userId } = useCurrentUser();
  const { transactions } = useTransactions(userId ?? '');
  const txsRef = useRef(transactions);
  txsRef.current = transactions;
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const runCheck = useCallback(async () => {
    if (!userId) return;
    const [displayName, businessName, businessType] = await Promise.all([
      getDisplayName(),
      getBusinessName(),
      getBusinessType(),
    ]);
    await runAutomatedBackupIfDue(userId, txsRef.current, {
      displayName,
      businessName,
      businessType,
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void runCheck();
  }, [userId, runCheck]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current === 'background' && nextState === 'active') {
        void runCheck();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [userId, runCheck]);

  return null;
}
