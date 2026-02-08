// income vs expense charts and category breakdown
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';

import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { TabHeader } from '../../components/TabHeader';
import { MobiFlowColors, FontFamily } from '../../constants/colors';
import { formatRWF } from '../../utils/formatCurrency';
import { computeReports } from '../../services/reportsService';
import { PrimaryButton } from '../../components/PrimaryButton';

const chartConfig = {
  backgroundColor: MobiFlowColors.surface,
  backgroundGradientFrom: MobiFlowColors.surface,
  backgroundGradientTo: MobiFlowColors.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(245, 197, 24, ${opacity})`,
  labelColor: () => MobiFlowColors.textSecondary,
  barPercentage: 0.7,
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

export default function ReportsScreen() {
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { userId } = useCurrentUser();
  const { transactions, loading } = useTransactions(userId);
  const reports = useMemo(() => computeReports(transactions), [transactions]);

  const onDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setDatePickerVisible(false);
    if (date) setSelectedDate(date);
  };

  let pieData = reports.pieData.filter((p) => p.amount > 0);
  if (pieData.length === 0 && reports.totalExpense === 0) {
    pieData = reports.pieData.map((p) => ({ ...p, amount: 1 }));
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={MobiFlowColors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      <TabHeader
        title="Reports"
        subtitle="Charts, insights & PDF export"
        rightContent={
          <TouchableOpacity style={styles.calendarBtn} onPress={() => setDatePickerVisible(true)}>
            <Ionicons name="calendar-outline" size={22} color={MobiFlowColors.primary} />
          </TouchableOpacity>
        }
      />
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Income</Text>
          <Text style={[styles.summaryAmount, styles.amountGreen]}>{formatRWF(reports.totalIncome, { compact: true })}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Expense</Text>
          <Text style={[styles.summaryAmount, styles.amountRed]}>{formatRWF(reports.totalExpense, { compact: true })}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryAmount, styles.amountGreen]}>{formatRWF(reports.net, { compact: true })}</Text>
        </View>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Income vs Expense (7 days)</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Income</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendSquare, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Expense</Text>
          </View>
        </View>
        <View style={styles.chartWrap}>
          {reports.stackedChartData.data.every((d) => d[0] === 0 && d[1] === 0) ? (
            <View style={styles.emptyChartState}>
              <Ionicons name="analytics-outline" size={48} color={MobiFlowColors.textSecondary} />
              <Text style={styles.emptyChartText}>Add income and expenses to see your 7-day trend.</Text>
            </View>
          ) : (
            <LineChart
              data={{
                labels: reports.stackedChartData.labels,
                datasets: [
                  {
                    data: reports.stackedChartData.data.map((d) => d[0]),
                    color: () => '#22C55E',
                    strokeWidth: 2,
                  },
                  {
                    data: reports.stackedChartData.data.map((d) => d[1]),
                    color: () => '#EF4444',
                    strokeWidth: 2,
                  },
                ],
                legend: ['Income', 'Expense'],
              }}
              width={Dimensions.get('window').width - 88}
              height={200}
              chartConfig={chartConfig}
              bezier
              withDots
              withInnerLines={false}
              hideLegend
              fromZero
              style={styles.chart}
            />
          )}
        </View>
      </View>
      <View style={styles.chartCard}>
        <Text style={styles.cardTitle}>Expense by Category</Text>
        <View style={styles.pieSection}>
          <View style={styles.pieWrap}>
            <PieChart
              data={pieData}
              width={220}
              height={220}
              chartConfig={chartConfig}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="55"
              hasLegend={false}
              absolute={false}
            />
            <View style={styles.pieDonutHole} />
            <View style={styles.pieCenter} pointerEvents="none">
              <Text style={styles.pieCenterLabel}>Total</Text>
              <Text style={styles.pieCenterAmount}>{formatRWF(reports.totalExpense)}</Text>
            </View>
          </View>
          <View style={styles.pieLegendBelow}>
            {reports.categories.map((c) => (
              <View key={c.name} style={styles.pieLegendItem}>
                <View style={[styles.pieLegendDot, { backgroundColor: c.chartColor }]} />
                <Text style={styles.pieLegendText}>{c.name} {formatRWF(c.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
        {reports.categories.map((c) => (
          <View key={c.name} style={styles.categoryRow}>
            <View style={[styles.categoryIconWrap, { backgroundColor: c.chartColor }]}>
              <Ionicons name={c.icon} size={20} color={c.color} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{c.name}</Text>
              <Text style={styles.categoryMeta}>{c.count} transactions</Text>
            </View>
            <Text style={styles.categoryAmount}>{formatRWF(c.amount)}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.topCustomersRow} activeOpacity={0.7}>
        <View style={styles.topCustomersLeft}>
          <Text style={styles.topCustomersTitle}>Top Customers</Text>
          <Text style={styles.topCustomersSub}>ML-powered customer value scoring</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={MobiFlowColors.textSecondary} />
      </TouchableOpacity>
      <View style={styles.exportWrap}>
        <PrimaryButton title="Export PDF" onPress={() => {}} />
      </View>

      {datePickerVisible && (
        Platform.OS === 'ios' ? (
          <Modal transparent visible animationType="slide">
            <TouchableOpacity style={styles.datePickerOverlay} activeOpacity={1} onPress={() => setDatePickerVisible(false)}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setDatePickerVisible(false)}>
                    <Text style={styles.datePickerDone}>Done</Text>
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
    backgroundColor: MobiFlowColors.background,
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
    backgroundColor: MobiFlowColors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  amountGreen: {
    color: '#22C55E',
  },
  amountRed: {
    color: '#EF4444',
  },
  chartCard: {
    backgroundColor: MobiFlowColors.surface,
    marginHorizontal: 24,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
    marginBottom: 12,
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
    color: MobiFlowColors.textSecondary,
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
    color: MobiFlowColors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 8,
  },
  pieSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  pieDonutHole: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: MobiFlowColors.surface,
    left: 55,
    top: 55,
  },
  pieCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieLegendBelow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    width: '48%',
  },
  pieLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pieLegendText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  pieCenterLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
  },
  pieCenterAmount: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: MobiFlowColors.textPrimary,
  },
  pieLegend: {
    flex: 1,
    marginLeft: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: MobiFlowColors.border,
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
  },
  categoryName: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  categoryMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginTop: 2,
  },
  categoryAmount: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
  },
  topCustomersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    padding: 18,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
  },
  topCustomersLeft: {
    flex: 1,
  },
  topCustomersTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
  },
  topCustomersSub: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginTop: 2,
  },
  exportWrap: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
    backgroundColor: MobiFlowColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: MobiFlowColors.border,
  },
  datePickerDone: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.accent,
  },
});
