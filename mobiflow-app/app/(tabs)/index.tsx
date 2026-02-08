// dashboard - balance, 7-day chart, recent transactions
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { BarChart } from 'react-native-chart-kit';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { MobiFlowColors, FontFamily } from '../../constants/colors';
import { formatRWF, formatRWFWithSign } from '../../utils/formatCurrency';
import { formatTransactionDate } from '../../utils/formatDate';
import { computeHomeSummary } from '../../services/summaryService';
import { TabHeader } from '../../components/TabHeader';

const chartConfig = {
  backgroundColor: MobiFlowColors.surface,
  backgroundGradientFrom: MobiFlowColors.surface,
  backgroundGradientTo: MobiFlowColors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(245, 197, 24, ${opacity})`,
  labelColor: () => MobiFlowColors.textSecondary,
  barPercentage: 0.6,
  propsForLabels: { fontSize: 11 },
  formatYLabel: (v: string) => {
    const n = Number(v);
    if (isNaN(n)) return v;
    const rwf = Math.round(n * 1000);
    if (rwf >= 1000) {
      const k = Math.floor(rwf / 1000);
      const rest = rwf % 1000;
      return rest === 0 ? `${k} 000` : `${k} ${String(rest).padStart(3, '0')}`;
    }
    return String(rwf);
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const { userId } = useCurrentUser();
  const { transactions, loading } = useTransactions(userId);
  const summary = useMemo(() => computeHomeSummary(transactions), [transactions]);

  const chartData = {
    labels: summary.chartLabels,
    datasets: [{ data: summary.chartData }],
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={MobiFlowColors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TabHeader title="Dashboard" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={20} color={MobiFlowColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions, amounts..."
            placeholderTextColor={MobiFlowColors.textSecondary}
          />
        </View>
        <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>{formatRWF(summary.balance)}</Text>
        <Text style={styles.balanceDetailGreen}>{formatRWFWithSign(summary.totalIncome)}</Text>
        <Text style={styles.balanceDetailRed}>{formatRWFWithSign(-summary.totalExpense)}</Text>
        </View>
        <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.summaryGreen}>{formatRWFWithSign(summary.totalIncome, { compact: true })}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={styles.summaryRed}>{formatRWFWithSign(-summary.totalExpense, { compact: true })}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={styles.summaryGreen}>{formatRWFWithSign(summary.net, { compact: true })}</Text>
        </View>
        </View>
        <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.cardTitle}>Cash Flow (7 days)</Text>
        </View>
        <View style={styles.chartWrap}>
          <BarChart
            data={chartData}
            width={Dimensions.get('window').width - 88}
            height={180}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={chartConfig}
            withInnerLines={false}
            fromZero
            style={styles.chart}
          />
        </View>
        </View>
        <View style={styles.savingsCard}>
        <View style={styles.savingsHeader}>
          <Text style={styles.savingsTitle}>Savings & Budget Goals</Text>
          <Text style={styles.savingsAmount}>{formatRWF(summary.net)}</Text>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Earned</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: summary.totalIncome + summary.totalExpense > 0 ? `${(summary.totalIncome / (summary.totalIncome + summary.totalExpense)) * 100}%` : '0%', backgroundColor: '#22C55E' }]} />
            </View>
            <Text style={styles.progressValue}>{formatRWF(summary.totalIncome, { compact: true })}</Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel}>Spent</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: summary.totalIncome + summary.totalExpense > 0 ? `${(summary.totalExpense / (summary.totalIncome + summary.totalExpense)) * 100}%` : '0%', backgroundColor: '#EF4444' }]} />
            </View>
            <Text style={styles.progressValue}>{formatRWF(summary.totalExpense, { compact: true })}</Text>
          </View>
        </View>
        </View>
        <View style={styles.recentCard}>
        <View style={styles.recentHeader}>
          <Text style={[styles.cardTitle, { marginBottom: 0 }]}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>
        {summary.recentTransactions.length === 0 ? (
          <Text style={styles.emptyRecent}>No transactions yet</Text>
        ) : (
          summary.recentTransactions.map((t) => (
            <View key={t.id} style={styles.transactionRow}>
              <View style={styles.transactionLeft}>
                <View style={[styles.iconWrap, t.type === 'income' ? styles.iconIncome : styles.iconExpense]}>
                  <Ionicons
                    name={t.type === 'income' ? 'arrow-up' : 'arrow-down'}
                    size={16}
                    color={t.type === 'income' ? '#22C55E' : '#EF4444'}
                  />
                </View>
                <View>
                  <Text style={styles.transactionLabel}>{t.label}</Text>
                  <Text style={styles.transactionDate}>{formatTransactionDate(t.createdAt)}</Text>
                </View>
              </View>
              <Text style={[styles.transactionAmount, t.type === 'income' ? styles.amountIncome : styles.amountExpense]}>
                {formatRWFWithSign(t.amount)}
              </Text>
            </View>
          ))
        )}
        </View>
        <View style={{ height: 100 }} />
    </ScrollView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MobiFlowColors.background,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MobiFlowColors.surface,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textPrimary,
  },
  balanceCard: {
    marginHorizontal: 24,
    padding: 24,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: MobiFlowColors.accent,
    marginBottom: 8,
  },
  balanceDetailGreen: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#22C55E',
  },
  balanceDetailRed: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: '#EF4444',
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: MobiFlowColors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginBottom: 4,
  },
  summaryGreen: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#22C55E',
  },
  summaryRed: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: '#EF4444',
  },
  chartCard: {
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
    marginBottom: 16,
  },
  chartHeader: {
    marginBottom: 12,
  },
  savingsCard: {
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: MobiFlowColors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
    marginBottom: 16,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  savingsTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
  },
  savingsAmount: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
  },
  progressRow: {
    gap: 16,
  },
  progressItem: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginBottom: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: MobiFlowColors.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressValue: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textSecondary,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
    marginBottom: 16,
  },
  chartWrap: {
    alignItems: 'center',
    marginHorizontal: -8,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 8,
  },
  recentCard: {
    marginHorizontal: 24,
    padding: 20,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.link,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MobiFlowColors.border,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconIncome: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  iconExpense: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  transactionLabel: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
  },
  amountIncome: {
    color: '#22C55E',
  },
  amountExpense: {
    color: '#EF4444',
  },
  emptyRecent: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    paddingVertical: 16,
    textAlign: 'center',
  },
});
