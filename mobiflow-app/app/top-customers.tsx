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
import type { CustomerValueScore } from '../services/customerValueScoringService';

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// Demo rows when no customers
const DEMO_CUSTOMERS: CustomerValueScore[] = [
  { phone: '0781234567', displayPhone: '078 123 4567', totalAmount: 450000, transactionCount: 12, lastTransactionDate: new Date(), valueScore: 78, valueTier: 'high', factors: { totalValue: 35, frequency: 25, recency: 12, consistency: 6 } },
  { phone: '0782345678', displayPhone: '078 234 5678', totalAmount: 280000, transactionCount: 8, lastTransactionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), valueScore: 52, valueTier: 'medium', factors: { totalValue: 22, frequency: 18, recency: 8, consistency: 4 } },
  { phone: '0783456789', displayPhone: '078 345 6789', totalAmount: 120000, transactionCount: 3, lastTransactionDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), valueScore: 31, valueTier: 'low', factors: { totalValue: 10, frequency: 8, recency: 4, consistency: 2 } },
];

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

  const showDemo = customers.length === 0;
  const listToShow = showDemo ? DEMO_CUSTOMERS : customers;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('topCustomers')} subtitle={t('topCustomersSubtitle')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {showDemo && (
          <View style={[styles.demoNoteWrap, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]}>
            <Text style={[styles.demoNote, { color: colors.textPrimary }]}>{t('topCustomersDemoNote')}</Text>
          </View>
        )}
        {listToShow.map((c, i) => (
          <View
            key={c.phone}
            style={[styles.customerRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.rankBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.rankText, { color: colors.black }]}>{i + 1}</Text>
            </View>
            <View style={styles.customerInfo}>
              <View style={styles.customerHeader}>
                <Text style={[styles.customerPhone, { color: colors.textPrimary }]}>{c.displayPhone}</Text>
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
                {c.transactionCount} {t('transactions').toLowerCase()} · {t('lastActivity')}: {formatDate(c.lastTransactionDate)}
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
