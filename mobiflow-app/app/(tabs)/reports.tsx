// Reports: income vs expense chart, category list, date filter, export PDF/CSV.
import { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useTranslations } from '../../hooks/useTranslations';
import { TabHeader } from '../../components/TabHeader';
import { getReportsLineChartConfig } from '../../constants/chartConfig';
import { FontFamily } from '../../constants/colors';
import { formatRWF } from '../../utils/formatCurrency';
import { computeReports } from '../../services/reportsService';
import { filterTransactions } from '../../utils/filterTransactions';
import { useReportsExport } from '../../hooks/useReportsExport';
import { fetchReportSummaryFromServer } from '../../services/cloudFunctionsService';
import type { ReportSummaryResponse } from '../../services/cloudFunctionsService';
import type { DateRangeFilter } from '../../types/transaction';
import { useRouter } from 'expo-router';

export default function ReportsScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const [pendingDateRange, setPendingDateRange] = useState<DateRangeFilter>('month');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('month');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [serverReport, setServerReport] = useState<ReportSummaryResponse | null>(null);

  const lineChartConfig = useMemo(() => getReportsLineChartConfig(colors), [colors]);
  const { userId } = useCurrentUser();
  const { transactions } = useTransactions(userId || null);

  useEffect(() => {
    if (pendingDateRange === dateRange) return;
    const id = requestAnimationFrame(() => setDateRange(pendingDateRange));
    return () => cancelAnimationFrame(id);
  }, [pendingDateRange, dateRange]);

  const reportDateRangeForApi = dateRange === '30days' ? 'month' : dateRange === 'week' || dateRange === 'all' ? dateRange : 'month';

  useEffect(() => {
    setServerReport(null);
    let cancelled = false;
    fetchReportSummaryFromServer(reportDateRangeForApi).then((result) => {
      if (!cancelled && result.ok && result.status === 200) setServerReport(result.data);
    });
    return () => { cancelled = true; };
  }, [reportDateRangeForApi]);

  const filteredTransactions = useMemo(() => {
    return filterTransactions(transactions, {
      type: 'all',
      dateRange,
      category: '',
      paymentMethod: 'all',
      search: '',
    });
  }, [transactions, dateRange]);

  const reports = useMemo(() => computeReports(filteredTransactions), [filteredTransactions]);
  const displayIncome = serverReport?.totalIncome ?? reports.totalIncome;
  const displayExpense = serverReport?.totalExpense ?? reports.totalExpense;
  const displayNet = serverReport?.net ?? reports.net;
  const displayCategoryCount = serverReport?.categoryCount ?? reports.categories.length;

  // Export (PDF, CSV, statement) lives in hook
  const {
    exporting,
    statementPeriodModalVisible,
    setStatementPeriodModalVisible,
    statementPeriod,
    setStatementPeriod,
    exportMenuVisible,
    setExportMenuVisible,
    exportButtonLayout,
    exportButtonRef,
    customPeriodModalVisible,
    setCustomPeriodModalVisible,
    startMonth,
    setStartMonth,
    endMonth,
    setEndMonth,
    startMonthPickerVisible,
    setStartMonthPickerVisible,
    endMonthPickerVisible,
    setEndMonthPickerVisible,
    handleExportPDF,
    handleExportCSV,
    handleExportStatement,
  } = useReportsExport(transactions, filteredTransactions, reports, t);

  const getDateRangeLabel = (range: DateRangeFilter): string => {
    switch (range) {
      case 'month': return t('filterThisMonth');
      case '30days': return t('filterLast30Days');
      case 'week': return t('filterThisWeek');
      case 'all': return t('filterAll');
      default: return '';
    }
  };

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setDatePickerVisible(false);
    if (date) setSelectedDate(date);
  };

  // Render straight away; data from cache
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.surfaceElevated }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <TabHeader
        title={t('reports')}
        subtitle={t('reportsSubtitle')}
        rightContent={
          <TouchableOpacity style={styles.calendarBtn} onPress={() => setDatePickerVisible(true)}>
            <Ionicons name="calendar-outline" size={22} color={colors.listIcon ?? colors.primary} />
          </TouchableOpacity>
        }
      />
      
      {/* Time Filter Pills – each in its own pill */}
      <View style={styles.timeFilterPills}>
        <TouchableOpacity
          style={[styles.timeFilterPill, { backgroundColor: pendingDateRange === 'month' ? colors.accent : colors.background, borderWidth: 1, borderColor: pendingDateRange === 'month' ? colors.accent : colors.border }]}
          onPress={() => setPendingDateRange('month')}>
          <Text style={[styles.timeFilterPillText, { color: pendingDateRange === 'month' ? colors.black : colors.textSecondary }]}>
            {t('filterThisMonth')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeFilterPill, { backgroundColor: pendingDateRange === '30days' ? colors.accent : colors.background, borderWidth: 1, borderColor: pendingDateRange === '30days' ? colors.accent : colors.border }]}
          onPress={() => setPendingDateRange('30days')}>
          <Text style={[styles.timeFilterPillText, { color: pendingDateRange === '30days' ? colors.black : colors.textSecondary }]}>
            {t('filterLast30Days')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeFilterPill, { backgroundColor: pendingDateRange === 'week' ? colors.accent : colors.background, borderWidth: 1, borderColor: pendingDateRange === 'week' ? colors.accent : colors.border }]}
          onPress={() => setPendingDateRange('week')}>
          <Text style={[styles.timeFilterPillText, { color: pendingDateRange === 'week' ? colors.black : colors.textSecondary }]}>
            {t('filterThisWeek')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeFilterPill, { backgroundColor: pendingDateRange === 'all' ? colors.accent : colors.background, borderWidth: 1, borderColor: pendingDateRange === 'all' ? colors.accent : colors.border }]}
          onPress={() => setPendingDateRange('all')}>
          <Text style={[styles.timeFilterPillText, { color: pendingDateRange === 'all' ? colors.black : colors.textSecondary }]}>
            {t('filterAll')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Large Summary Cards */}
      <View style={styles.summaryCardsRow}>
        <View style={[styles.summaryCardLarge, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.summaryCardHeader}>
            <Ionicons name="arrow-down" size={24} color={colors.success} />
            <View style={styles.summaryCardTitleWrap}>
              <Text style={[styles.summaryCardLabel, { color: colors.textPrimary }]}>{t('income')}</Text>
              <Text style={[styles.summaryCardDescription, { color: colors.textSecondary }]}>{t('incomeDescription')}</Text>
            </View>
          </View>
          <Text style={[styles.summaryCardAmount, { color: colors.success }]}>{formatRWF(displayIncome)}</Text>
          <Text style={[styles.summaryCardNet, { color: colors.textSecondary }]}>
            {t('net')}: <Text style={{ color: displayNet >= 0 ? colors.success : colors.error }}>{formatRWF(displayNet)}</Text>
          </Text>
        </View>
        <View style={[styles.summaryCardLarge, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.summaryCardHeader}>
            <Ionicons name="arrow-up" size={24} color={colors.error} />
            <View style={styles.summaryCardTitleWrap}>
              <Text style={[styles.summaryCardLabel, { color: colors.textPrimary }]}>{t('expense')}</Text>
              <Text style={[styles.summaryCardDescription, { color: colors.textSecondary }]}>{t('expenseDescription')}</Text>
            </View>
          </View>
          <Text style={[styles.summaryCardAmount, { color: colors.error }]}>{formatRWF(displayExpense)}</Text>
          <Text style={[styles.summaryCardMeta, { color: colors.textSecondary }]}>
            {displayCategoryCount} {displayCategoryCount === 1 ? 'category' : 'categories'}
          </Text>
        </View>
      </View>
      <View style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('incomeVsExpense7Days')}</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{t('incomeVsExpense7DaysDescription')}</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: colors.success }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('income')}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: colors.error }]} />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('expense')}</Text>
          </View>
        </View>
        <View style={styles.chartWrap}>
          {reports.stackedChartData.data.every((d) => d[0] === 0 && d[1] === 0) ? (
            <View style={styles.emptyChartState}>
              <Ionicons name="analytics-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>{t('addIncomeExpenseToSeeTrend')}</Text>
            </View>
          ) : (
            <LineChart
              data={{
                labels: reports.stackedChartData.labels,
                datasets: [
                  {
                    data: reports.stackedChartData.data.map((d) => d[0]),
                    color: () => colors.success,
                    strokeWidth: 2,
                  },
                  {
                    data: reports.stackedChartData.data.map((d) => d[1]),
                    color: () => colors.error,
                    strokeWidth: 2,
                  },
                ],
                legend: ['Income', 'Expense'],
              }}
              width={Dimensions.get('window').width - 88}
              height={200}
              chartConfig={lineChartConfig}
              bezier
              withDots
              withInnerLines={false}
              withShadow={false}
              fromZero
              style={styles.chart}
            />
          )}
        </View>
      </View>
      <View style={[styles.chartCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('expensesByCategory')}</Text>
          <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>{t('expensesByCategoryDescription')}</Text>
        </View>
        <View style={styles.categoriesList}>
          {reports.categories.map((c) => (
            <View key={c.name} style={[styles.categoryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.categoryIconWrap, { backgroundColor: c.chartColor + '26' }]}>
                <Ionicons name={c.icon} size={20} color={c.chartColor} />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{c.name}</Text>
                <Text style={[styles.categoryMeta, { color: colors.textSecondary }]}>
                  {c.count} {c.count === 1 ? 'transaction' : 'transactions'}
                </Text>
              </View>
              <Text style={[styles.categoryAmount, { color: colors.textPrimary }]}>{formatRWF(c.amount)}</Text>
            </View>
          ))}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.topCustomersRow, { backgroundColor: colors.background, borderColor: colors.border }]}
        activeOpacity={0.7}
        onPress={() => router.push('/top-customers')}>
        <View style={styles.topCustomersLeft}>
          <Text style={[styles.topCustomersTitle, { color: colors.textPrimary }]}>{t('topCustomers')}</Text>
          <Text style={[styles.topCustomersSub, { color: colors.textSecondary }]}>{t('topCustomersSubtitle')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      <View style={styles.exportSection}>
        <TouchableOpacity
          ref={exportButtonRef}
          style={[styles.exportDropdown, { backgroundColor: colors.accent }]}
          onPress={() => setExportMenuVisible(!exportMenuVisible)}
          disabled={!!exporting}>
          <Text style={[styles.exportDropdownText, { color: colors.black }]}>
            {exporting === 'pdf' ? t('exporting') : exporting === 'csv' ? t('exporting') : exporting === 'statement' ? t('exporting') : t('downloadReport') || 'Download Report'}
          </Text>
          <Ionicons name={exportMenuVisible ? 'chevron-up' : 'chevron-down'} size={20} color={colors.black} />
        </TouchableOpacity>
      </View>

      {/* Export Menu Modal - Anchored to Button */}
      <Modal
        visible={exportMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExportMenuVisible(false)}>
        <TouchableOpacity
          style={styles.exportMenuOverlay}
          activeOpacity={1}
          onPress={() => setExportMenuVisible(false)}>
          {exportButtonLayout && (
            <Pressable
              style={[
                styles.exportMenuAnchored,
                styles.exportMenuAnchoredShadow,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  top: exportButtonLayout.showAbove ? undefined : exportButtonLayout.y,
                  bottom: exportButtonLayout.showAbove ? Dimensions.get('window').height - exportButtonLayout.y + 4 : undefined,
                  left: exportButtonLayout.x,
                  width: exportButtonLayout.width,
                },
              ]}
              onPress={(e) => e.stopPropagation()}>
              <View style={[styles.exportMenuHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.exportMenuTitle, { color: colors.textPrimary }]}>{t('chooseDownloadFormat') || 'Choose download format'}</Text>
                <Text style={[styles.exportMenuSubtitle, { color: colors.textSecondary }]}>
                  {t('period')}: {getDateRangeLabel(pendingDateRange)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.exportMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setExportMenuVisible(false);
                  handleExportPDF();
                }}
                disabled={!!exporting}>
                <Ionicons name="document-text" size={20} color={colors.textPrimary} />
                <Text style={[styles.exportMenuItemText, { color: colors.textPrimary }]}>{t('downloadPDF') || 'Download PDF'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exportMenuItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setExportMenuVisible(false);
                  handleExportCSV();
                }}
                disabled={!!exporting}>
                <Ionicons name="document" size={20} color={colors.textPrimary} />
                <Text style={[styles.exportMenuItemText, { color: colors.textPrimary }]}>{t('downloadCSV') || 'Download CSV'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportMenuItem}
                onPress={() => {
                  setExportMenuVisible(false);
                  handleExportStatement();
                }}
                disabled={!!exporting}>
                <Ionicons name="download" size={20} color={colors.textPrimary} />
                <Text style={[styles.exportMenuItemText, { color: colors.textPrimary }]}>{t('downloadStatement')}</Text>
              </TouchableOpacity>
            </Pressable>
          )}
        </TouchableOpacity>
      </Modal>

      <Modal visible={statementPeriodModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStatementPeriodModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('selectPeriod')}</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.periodOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setStatementPeriod('30days');
                  setStatementPeriodModalVisible(false);
                  handleExportStatement('30days');
                }}>
                <Text style={[styles.periodOptionText, { color: colors.textPrimary }]}>{t('last30Days')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setStatementPeriod('3months');
                  setStatementPeriodModalVisible(false);
                  handleExportStatement('3months');
                }}>
                <Text style={[styles.periodOptionText, { color: colors.textPrimary }]}>{t('last3Months')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setStatementPeriod('6months');
                  setStatementPeriodModalVisible(false);
                  handleExportStatement('6months');
                }}>
                <Text style={[styles.periodOptionText, { color: colors.textPrimary }]}>{t('last6Months')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setStatementPeriodModalVisible(false);
                  setCustomPeriodModalVisible(true);
                }}>
                <Text style={[styles.periodOptionText, { color: colors.textPrimary }]}>{t('customPeriod')}</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={[styles.modalCancelBtn, { borderTopColor: colors.border }]}
              onPress={() => setStatementPeriodModalVisible(false)}>
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* Custom Period Selection Modal */}
      <Modal visible={customPeriodModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCustomPeriodModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('selectCustomPeriod') || 'Select Period'}</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <View style={[styles.customPeriodRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.customPeriodLabel, { color: colors.textSecondary }]}>{t('startMonth') || 'Start Month'}</Text>
                <TouchableOpacity
                  style={[styles.monthPickerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setStartMonthPickerVisible(true)}>
                  <Text style={[styles.monthPickerText, { color: colors.textPrimary }]}>
                    {startMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={[styles.customPeriodRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.customPeriodLabel, { color: colors.textSecondary }]}>{t('endMonth') || 'End Month'}</Text>
                <TouchableOpacity
                  style={[styles.monthPickerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                  onPress={() => setEndMonthPickerVisible(true)}>
                  <Text style={[styles.monthPickerText, { color: colors.textPrimary }]}>
                    {endMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </ScrollView>
            <View style={[styles.customPeriodActions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.customPeriodCancelBtn, { borderTopColor: colors.border }]}
                onPress={() => setCustomPeriodModalVisible(false)}>
                <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customPeriodConfirmBtn, { backgroundColor: colors.accent }]}
                onPress={() => {
                  setCustomPeriodModalVisible(false);
                  handleExportStatement('custom');
                }}>
                <Text style={[styles.customPeriodConfirmText, { color: colors.black }]}>{t('generateStatement') || 'Generate Statement'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {/* Start Month Picker */}
      {startMonthPickerVisible && (
        Platform.OS === 'ios' ? (
          <Modal transparent visible animationType="slide">
            <TouchableOpacity style={styles.datePickerOverlay} activeOpacity={1} onPress={() => setStartMonthPickerVisible(false)}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setStartMonthPickerVisible(false)}>
                    <Text style={[styles.datePickerDone, { color: colors.accent }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startMonth}
                  mode="date"
                  display="spinner"
                  onChange={(_, date) => {
                    if (date) {
                      const d = new Date(date);
                      d.setDate(1); // First day of month
                      setStartMonth(d);
                    }
                  }}
                  maximumDate={endMonth}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={startMonth}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setStartMonthPickerVisible(false);
              if (date) {
                const d = new Date(date);
                d.setDate(1); // First day of month
                setStartMonth(d);
              }
            }}
            maximumDate={endMonth}
          />
        )
      )}

      {/* End Month Picker */}
      {endMonthPickerVisible && (
        Platform.OS === 'ios' ? (
          <Modal transparent visible animationType="slide">
            <TouchableOpacity style={styles.datePickerOverlay} activeOpacity={1} onPress={() => setEndMonthPickerVisible(false)}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setEndMonthPickerVisible(false)}>
                    <Text style={[styles.datePickerDone, { color: colors.accent }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endMonth}
                  mode="date"
                  display="spinner"
                  onChange={(_, date) => {
                    if (date) {
                      const d = new Date(date);
                      d.setDate(1); // First day of month
                      setEndMonth(d);
                    }
                  }}
                  maximumDate={new Date()}
                  minimumDate={startMonth}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={endMonth}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setEndMonthPickerVisible(false);
              if (date) {
                const d = new Date(date);
                d.setDate(1); // First day of month
                setEndMonth(d);
              }
            }}
            maximumDate={new Date()}
            minimumDate={startMonth}
          />
        )
      )}

      {datePickerVisible && (
        Platform.OS === 'ios' ? (
          <Modal transparent visible animationType="slide">
            <TouchableOpacity style={styles.datePickerOverlay} activeOpacity={1} onPress={() => setDatePickerVisible(false)}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                    <Text style={[styles.datePickerDone, { color: colors.accent }]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timeFilterPills: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  timeFilterPill: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeFilterPillText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  summaryCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  summaryCardLarge: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  summaryCardTitleWrap: {
    flex: 1,
  },
  summaryCardLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    marginBottom: 2,
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
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  amountGreen: {
    // inline
  },
  amountRed: {
    // inline
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
  cardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  cardDescription: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  chartWrap: {
    alignItems: 'center',
    marginHorizontal: -8,
  },
  emptyChartState: {
    width: Dimensions.get('window').width - 88,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyChartText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 8,
  },
  categoriesList: {
    gap: 12,
    marginTop: 8,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryInfo: {
    flex: 1,
    minWidth: 0,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    marginBottom: 2,
  },
  categoryMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  topCustomersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    padding: 18,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
  },
  topCustomersLeft: {
    flex: 1,
  },
  topCustomersTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  topCustomersSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  exportSection: {
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 24,
    position: 'relative',
  },
  exportDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  exportDropdownText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
  },
  exportMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  exportMenuAnchored: {
    position: 'absolute',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 8,
  },
  exportMenuAnchoredShadow: Platform.select({
    web: { boxShadow: '0 4px 8px rgba(0,0,0,0.25)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
  }),
  exportMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  exportMenuItemText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    flex: 1,
  },
  exportMenuHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  exportMenuTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  exportMenuSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120, // Increased to allow scrolling to see all content
  },
  calendarBtn: {
    padding: 4,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
  },
  datePickerDone: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  modalScroll: {
    maxHeight: 400,
  },
  periodOption: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  periodOptionText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  modalCancelBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  customPeriodRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  customPeriodLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
  },
  monthPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
  },
  monthPickerText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  customPeriodActions: {
    borderTopWidth: 1,
  },
  customPeriodCancelBtn: {
    padding: 16,
    borderTopWidth: 1,
  },
  customPeriodConfirmBtn: {
    padding: 16,
    alignItems: 'center',
  },
  customPeriodConfirmText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
});
