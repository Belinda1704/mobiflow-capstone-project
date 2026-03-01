// Dashboard: balance, period filter, chart, goals link, recent transactions. Asks for SMS/notif once after signup.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarChart } from 'react-native-chart-kit';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { isSmsCaptureSupported, requestSmsPermissions } from '../../services/smsCaptureService';
import { requestNotificationPermission } from '../../services/goalRemindersService';
import { useTransactions } from '../../hooks/useTransactions';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useTranslations } from '../../hooks/useTranslations';
import { FontFamily } from '../../constants/colors';
import { formatRWF, formatRWFWithSign } from '../../utils/formatCurrency';
import { formatTransactionDate } from '../../utils/formatDate';
import { computeHomeSummary } from '../../services/summaryService';
import { useAlertsCheck } from '../../hooks/useAlertsCheck';
import { useAlerts } from '../../hooks/useAlerts';
import { useAlertTriggers } from '../../hooks/useAlertTriggers';
import { TabHeader } from '../../components/TabHeader';
import { getDashboardChartConfig } from '../../constants/chartConfig';
import { useSavingsGoals } from '../../hooks/useSavingsGoals';
import { getTransactionCategoryIcon } from '../../utils/transactionCategoryIcon';
import { filterTransactions } from '../../utils/filterTransactions';
import type { DateRangeFilter } from '../../types/transaction';

const DASHBOARD_PERIODS: DateRangeFilter[] = ['today', 'week', 'month', 'all'];

// Flag so dashboard shows permission prompts once after signup
const SHOW_PERMISSIONS_ON_DASHBOARD_KEY = '@mobiflow/showPermissionsOnDashboard';

function getPeriodLabel(period: DateRangeFilter, t: (key: string) => string): string {
  switch (period) {
    case 'today': return t('summaryToday');
    case 'week': return t('summaryThisWeek');
    case 'month': return t('summaryThisMonth');
    case 'all': return t('summaryAllTime');
    default: return t('summaryAllTime');
  }
}

function getTimeBasedGreetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const hour = new Date().getHours();
  if (hour < 12) return 'greetingMorning';
  if (hour < 17) return 'greetingAfternoon';
  return 'greetingEvening';
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const [dashboardPeriod, setDashboardPeriod] = useState<DateRangeFilter>('all');
  const { userId } = useCurrentUser();
  const { transactions } = useTransactions(userId || null);
  const filteredTransactions = useMemo(
    () =>
      filterTransactions(transactions, {
        type: 'all',
        dateRange: dashboardPeriod,
        category: '',
        paymentMethod: 'all',
        search: '',
      }),
    [transactions, dashboardPeriod]
  );
  const summary = useMemo(() => computeHomeSummary(filteredTransactions), [filteredTransactions]);
  const { goals } = useSavingsGoals(userId, transactions);
  const { incomeDrop, budgetBreaches, totalExpenseThisMonth } = useAlertsCheck(userId, transactions);
  const { settings: alertSettings } = useAlerts(userId);

  useAlertTriggers(
    userId ?? undefined,
    summary.balance,
    alertSettings ?? undefined,
    budgetBreaches,
    totalExpenseThisMonth,
    incomeDrop?.percentDrop ?? null
  );

  // Ask for SMS + notification permission once after signup
  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem(SHOW_PERMISSIONS_ON_DASHBOARD_KEY).then((value) => {
        if (value !== 'true') return;
        (async () => {
          try {
            if (isSmsCaptureSupported()) await requestSmsPermissions();
            await requestNotificationPermission();
          } catch {
            // Can fail in Expo Go
          }
          await AsyncStorage.setItem(SHOW_PERMISSIONS_ON_DASHBOARD_KEY, 'false');
        })();
      });
    }, [])
  );

  const barChartConfig = useMemo(() => getDashboardChartConfig(colors), [colors]);
  const barChartData = {
    labels: summary.chartLabels,
    datasets: [{ data: summary.chartData }],
  };

  // No spinner – data from cache

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <TabHeader title={t('dashboard')} subtitle={t(getTimeBasedGreetingKey())} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>

        {(incomeDrop || budgetBreaches.length > 0) ? (
          <View style={[styles.alertsBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
            <Ionicons name="alert-circle" size={20} color={colors.warning} />
            <View style={styles.alertsBannerText}>
              {incomeDrop && (
                <Text style={[styles.alertsBannerItem, { color: colors.warningText }]}>{t('incomeDropAlert', { percent: incomeDrop.percentDrop })}</Text>
              )}
              {budgetBreaches.slice(0, 2).map((b) => (
                <Text key={b.category} style={[styles.alertsBannerItem, { marginTop: 4, color: colors.warningText }]}>{t('budgetBreachAlert', { category: b.category, percent: b.percentOver })}</Text>
              ))}
            </View>
          </View>
        ) : null}
        {/* Period selector: so balance and totals match the period (e.g. Today = only today's txns) */}
        <View style={styles.periodPillsRow}>
          {DASHBOARD_PERIODS.map((period) => (
            <TouchableOpacity
              key={period}
              style={[styles.periodPill, { backgroundColor: dashboardPeriod === period ? colors.accent : colors.background, borderWidth: 1, borderColor: dashboardPeriod === period ? colors.accent : colors.border }]}
              onPress={() => setDashboardPeriod(period)}>
              <Text style={[styles.periodPillText, { color: dashboardPeriod === period ? colors.black : colors.textSecondary }]}>
                {getPeriodLabel(period, t)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={[styles.balanceCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceTitleWrap}>
            <Text style={[styles.balanceLabel, { color: colors.textPrimary }]}>{t('currentBalance')}</Text>
            <Text style={[styles.balanceDescription, { color: colors.textSecondary }]}>{t('currentBalanceDescription')}</Text>
          </View>
          <Text style={[styles.periodBadge, { color: colors.textSecondary }]}>{getPeriodLabel(dashboardPeriod, t)}</Text>
        </View>
        <Text style={[styles.balanceAmount, { color: colors.accent }]}>{formatRWF(summary.balance)}</Text>
        <Text style={[styles.balanceDetailGreen, { color: colors.success }]}>{formatRWFWithSign(summary.totalIncome)}</Text>
        <Text style={[styles.balanceDetailRed, { color: colors.error }]}>{formatRWFWithSign(-summary.totalExpense)}</Text>
        </View>
        {/* Summary Cards - neutral background, colored icons/amounts */}
        <View style={styles.summaryCardsRow}>
          <View style={[styles.summaryCardLarge, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.summaryCardHeader}>
              <View style={styles.summaryCardHeaderRow}>
                <Ionicons name="arrow-down" size={24} color={colors.success} />
                <Text style={[styles.summaryCardLabel, { color: colors.textPrimary }]}>{t('income')}</Text>
              </View>
              <Text style={[styles.summaryCardDescription, { color: colors.textSecondary }]}>{t('incomeDescription')}</Text>
            </View>
            <Text style={[styles.summaryCardAmount, { color: colors.success }]}>{formatRWF(summary.totalIncome)}</Text>
            <Text style={[styles.summaryCardNet, { color: colors.textSecondary }]}>
              {t('net')}: <Text style={{ color: summary.net >= 0 ? colors.success : colors.error }}>{formatRWF(summary.net)}</Text>
            </Text>
          </View>
          <View style={[styles.summaryCardLarge, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.summaryCardHeader}>
              <View style={styles.summaryCardHeaderRow}>
                <Ionicons name="arrow-up" size={24} color={colors.error} />
                <Text style={[styles.summaryCardLabel, { color: colors.textPrimary }]}>{t('expense')}</Text>
              </View>
              <Text style={[styles.summaryCardDescription, { color: colors.textSecondary }]}>{t('expenseDescription')}</Text>
            </View>
            <Text style={[styles.summaryCardAmount, { color: colors.error }]}>{formatRWF(summary.totalExpense)}</Text>
            <Text style={[styles.summaryCardMeta, { color: colors.textSecondary }]}>
              {summary.totalExpense > 0 ? Math.round((summary.totalExpense / (summary.totalIncome || 1)) * 100) : 0}% {t('ofIncome') || 'of income'}
            </Text>
          </View>
        </View>
        <View style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('cashFlow7Days')}</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{t('cashFlow7DaysDescription')}</Text>
        </View>
        <View style={styles.chartWrap}>
          <BarChart
            data={barChartData}
            width={Dimensions.get('window').width - 88}
            height={200}
            chartConfig={barChartConfig as Record<string, unknown>}
            withInnerLines={true}
            fromZero
            style={styles.chart}
            showBarTops={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisLabel=""
            yAxisSuffix=""
          />
        </View>
        </View>
        <TouchableOpacity
          style={[styles.savingsCard, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => router.push('/savings-budget-goals')}
          activeOpacity={0.7}>
          <View style={styles.savingsHeader}>
            <Text style={[styles.savingsTitle, { color: colors.textPrimary }]}>{t('savingsBudgetGoals')}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
          {goals.length === 0 ? (
            <View style={styles.noGoalsContainer}>
              <Text style={[styles.noGoalsText, { color: colors.textSecondary }]}>{t('noSavingsGoalsYet')}</Text>
              <Text style={[styles.noGoalsHint, { color: colors.textSecondary }]}>{t('tapToSetGoals')}</Text>
            </View>
          ) : (
            <>
              <View style={styles.goalsSummary}>
                {goals.slice(0, 3).map((goal) => (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={styles.goalHeader}>
                      <Text style={[styles.goalName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {goal.name}
                      </Text>
                      <Text style={[styles.goalPercent, { color: colors.textSecondary }]}>{Math.round(goal.percent)}%</Text>
                    </View>
                    <View style={[styles.goalProgressBar, { backgroundColor: colors.surfaceElevated }]}>
                      <View
                        style={[
                          styles.goalProgressFill,
                          {
                            width: `${Math.min(goal.percent, 100)}%`,
                            backgroundColor: goal.percent >= 100 ? colors.success : colors.accent,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
                      {formatRWF(goal.current)} / {formatRWF(goal.target)}
                    </Text>
                  </View>
                ))}
                {goals.length > 3 && (
                  <Text style={[styles.moreGoalsText, { color: colors.textSecondary }]}>
                    {t('andMoreGoals', { count: goals.length - 3 })}
                  </Text>
                )}
              </View>
            </>
          )}
        </TouchableOpacity>
        <View style={[styles.recentCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.recentHeader}>
          <View style={styles.recentTitleWrap}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary, marginBottom: 0 }]}>{t('recentTransactions')}</Text>
            <Text style={[styles.cardDescription, { color: colors.textSecondary, marginTop: 4 }]}>{t('recentTransactionsDescription')}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.navigate('/(tabs)/transactions')}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.viewAllTouchable}>
            <Text style={[styles.viewAll, { color: colors.textSecondary }]}>{t('viewAll')}</Text>
          </TouchableOpacity>
        </View>
        {summary.recentTransactions.length === 0 ? (
          <Text style={[styles.emptyRecent, { color: colors.textSecondary }]}>{t('noTransactionsYet')}</Text>
        ) : (
          summary.recentTransactions.slice(0, 6).map((tx) => {
            const catIcon = getTransactionCategoryIcon(tx.category ?? 'Other', tx.type);
            return (
              <View key={tx.id} style={[styles.transactionRow, { borderBottomColor: colors.border }]}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.categoryIconWrap, { backgroundColor: catIcon.backgroundColor }]}>
                    <Ionicons name={catIcon.icon} size={18} color={catIcon.iconColor} />
                  </View>
                  <View>
                    <Text style={[styles.transactionLabel, { color: colors.textPrimary }]} numberOfLines={1}>{tx.label}</Text>
                    <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>{formatTransactionDate(tx.createdAt)}</Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, { color: tx.type === 'income' ? colors.success : colors.error }]}>
                  {formatRWFWithSign(tx.amount)}
                </Text>
              </View>
            );
          })
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
  },
  dateText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: 8,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  alertsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  alertsBannerText: { flex: 1 },
  alertsBannerItem: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  periodPillsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 12,
    gap: 8,
  },
  periodPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  balanceCard: {
    marginHorizontal: 24,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  balanceTitleWrap: {
    flex: 1,
  },
  periodBadge: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  balanceLabel: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  balanceDescription: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  balanceAmount: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  balanceDetailGreen: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  balanceDetailRed: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  summaryCardLarge: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryCardHeader: {
    marginBottom: 12,
  },
  summaryCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  summaryCardDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  summaryCardAmount: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  summaryCardNet: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  summaryCardMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  chartCard: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  savingsCard: {
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  savingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  savingsTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  noGoalsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noGoalsText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
    textAlign: 'center',
  },
  noGoalsHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  goalsSummary: {
    gap: 16,
  },
  goalItem: {
    marginBottom: 4,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalName: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  goalPercent: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    marginLeft: 8,
  },
  goalProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalAmount: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  moreGoalsText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
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
    borderRadius: 16,
    borderWidth: 1,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recentTitleWrap: {
    flex: 1,
  },
  viewAllTouchable: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  viewAll: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconIncome: {
    // inline
  },
  iconExpense: {
    // inline
  },
  transactionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  amountIncome: {
    // inline
  },
  amountExpense: {
    // inline
  },
  emptyRecent: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    paddingVertical: 16,
    textAlign: 'center',
  },
});
