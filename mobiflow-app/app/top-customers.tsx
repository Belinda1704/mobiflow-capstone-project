// Top customers from income (SMS or manual), sorted. Demo rows when empty.
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactions } from '../hooks/useTransactions';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { formatRWF } from '../utils/formatCurrency';
import { computeTopCustomers } from '../services/customerIdentificationService';
import { computeCustomerValueScore } from '../services/customerValueScoringService';

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function TopCustomersScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const { transactions } = useTransactions(userId ?? ''); // Removed loading - show UI immediately
  const basicCustomers = computeTopCustomers(transactions);
  // Score by value, frequency, recency, then sort
  const customers = basicCustomers
    .map((c) => computeCustomerValueScore(c, transactions))
    .sort((a, b) => b.valueScore - a.valueScore);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('topCustomers')} subtitle={t('topCustomersSubtitle')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {customers.length === 0 && (
          <View style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>{t('noTopCustomersYet')}</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('noTopCustomersHint')}</Text>
          </View>
        )}
        {customers.map((c, i) => (
          <View
            key={c.phone}
            style={[styles.customerRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.rankBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.rankText, { color: colors.black }]}>{i + 1}</Text>
            </View>
            <View style={styles.customerInfo}>
              <View style={styles.customerHeader}>
                <Text style={[styles.customerPhone, { color: colors.textPrimary }]}>
                  {c.displayName || c.displayPhone}
                </Text>
                {c.valueTier === 'high' && (
                  <View style={[styles.tierBadge, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                    <Text style={[styles.tierText, { color: colors.success }]}>High Value</Text>
                  </View>
                )}
                {c.valueTier === 'medium' && (
                  <View style={[styles.tierBadge, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]}>
                    <Text style={[styles.tierText, { color: colors.warning }]}>Medium</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.customerMeta, { color: colors.textSecondary }]}>
                {c.displayPhone} · {c.transactionCount} {t('transactions').toLowerCase()} · {t('lastActivity')}: {formatDate(c.lastTransactionDate)}
              </Text>
            </View>
            <View style={styles.amountColumn}>
              <Text style={[styles.customerAmount, { color: colors.textPrimary }]}>{formatRWF(c.totalAmount)}</Text>
              <Text style={[styles.valueScoreText, { color: colors.textSecondary }]}>Score: {c.valueScore}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40 },
  demoNoteWrap: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  demoNote: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  emptyCard: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rankText: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  customerInfo: { flex: 1 },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  customerPhone: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierText: {
    fontSize: 10,
    fontFamily: FontFamily.semiBold,
  },
  customerMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  amountColumn: {
    alignItems: 'flex-end',
  },
  customerAmount: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  valueScoreText: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
});
