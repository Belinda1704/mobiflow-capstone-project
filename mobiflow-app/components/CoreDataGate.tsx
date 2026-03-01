/**
 * Show main UI once transaction data is ready (e.g. from cache).
 * First-time login shows a loading screen until the first data loads.
 * Then show cache first and refresh in background.
 */
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactionsContext } from '../contexts/TransactionsContext';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

export function CoreDataGate({ children }: { children: React.ReactNode }) {
  const { userId } = useCurrentUser();
  const { transactions, loading } = useTransactionsContext();
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  // Not logged in – still render children; auth redirect will send them to login
  if (!userId) {
    return <>{children}</>;
  }

  // Loading only when no data yet. Otherwise show UI and refresh in background.
  const hasDataToShow = transactions.length > 0 || !loading;
  if (!hasDataToShow) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {t('loadingYourData') || 'Loading your data...'}
        </Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
});
