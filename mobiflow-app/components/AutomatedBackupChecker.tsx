// Runs automated cloud backup when app is opened or returns to foreground, if last backup was > 24h ago.
import { useEffect, useRef } from 'react';
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
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const runCheck = async () => {
    if (!userId || transactions.length === 0) return;
    const [displayName, businessName, businessType] = await Promise.all([
      getDisplayName(),
      getBusinessName(),
      getBusinessType(),
    ]);
    await runAutomatedBackupIfDue(userId, transactions, {
      displayName,
      businessName,
      businessType,
    });
  };

  useEffect(() => {
    if (!userId) return;
    runCheck();
  }, [userId, transactions.length]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (appState.current === 'background' && nextState === 'active') {
        runCheck();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, [userId, transactions]);

  return null;
}
