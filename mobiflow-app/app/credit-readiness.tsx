// Credit readiness: income and cash flow, export PDF for bank/MFI.
import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactions } from '../hooks/useTransactions';
import { useCreditReadiness, type CreditReadinessPeriod } from '../hooks/useCreditReadiness';
import { getLastNMonthsRange, assessCreditworthiness } from '../services/financialInsightsService';
import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { formatRWF } from '../utils/formatCurrency';
import { buildCreditReadinessHtml } from '../utils/creditReadinessPdf';

type PeriodPreset = 'last6' | 'last12' | 'custom';

function toYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function parseYearMonth(ym: string): Date {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

export default function CreditReadinessScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId, user } = useCurrentUser();
  const { transactions } = useTransactions(userId || null);
  const authId = user?.email ?? '';

  const now = useMemo(() => new Date(), []);
  const defaultRange = useMemo(() => getLastNMonthsRange(6), []);

  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last6');
  const [customStart, setCustomStart] = useState<Date>(() => parseYearMonth(defaultRange.startYearMonth));
  const [customEnd, setCustomEnd] = useState<Date>(() => parseYearMonth(defaultRange.endYearMonth));
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const CASH_FLOW_PAGE_SIZE = 15;
  const [cashFlowPage, setCashFlowPage] = useState(0);

  const period: CreditReadinessPeriod | null = useMemo(() => {
    if (periodPreset === 'last6') return getLastNMonthsRange(6);
    if (periodPreset === 'last12') return getLastNMonthsRange(12);
    const start = toYearMonth(customStart);
    const end = toYearMonth(customEnd);
    if (start > end) return { startYearMonth: end, endYearMonth: start };
    return { startYearMonth: start, endYearMonth: end };
  }, [periodPreset, customStart, customEnd]);

  const data = useCreditReadiness(transactions, authId, period);
  const assessment = useMemo(() => assessCreditworthiness(data), [data]);
  const cashFlowRows = data.cashFlowByDay ?? [];
  const totalCashFlowPages = Math.max(1, Math.ceil(cashFlowRows.length / CASH_FLOW_PAGE_SIZE));
  const paginatedRows = useMemo(
    () =>
      cashFlowRows.slice(
        cashFlowPage * CASH_FLOW_PAGE_SIZE,
        (cashFlowPage + 1) * CASH_FLOW_PAGE_SIZE
      ),
    [cashFlowRows, cashFlowPage, CASH_FLOW_PAGE_SIZE]
  );
  useEffect(() => {
    if (cashFlowPage >= totalCashFlowPages && totalCashFlowPages > 0) setCashFlowPage(0);
  }, [totalCashFlowPages, cashFlowRows.length]);

  if (!userId) {
    return null;
  }

  const pdfLabels = {
    creditReadiness: t('creditReadiness'),
    creditSummaryForBanks: t('creditSummaryForBanks'),
    creditSummary: t('creditSummary'),
    cashFlowStability: t('cashFlowStability'),
    scoreGood: t('scoreGood'),
    needsImprovement: t('needsImprovement'),
    avgMonthlyIncome: t('avgMonthlyIncome'),
    avgMonthlyExpense: t('avgMonthlyExpense'),
    savingsRate: t('savingsRate'),
    transactionFrequency: t('transactionFrequency'),
    perMonthSuffix: t('perMonthSuffix'),
    verificationStatus: t('verificationStatus'),
    incomeVerification: t('incomeVerification'),
    businessStability: t('businessStability'),
    last6Months: t('last6Months'),
    monthsActive: t('monthsActive'),
    cashFlowStatement: t('cashFlowStatement'),
    period: t('period'),
    cashIn: t('cashIn'),
    cashOut: t('cashOut'),
    net: t('net'),
    month: t('month'),
    date: t('date'),
  };

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const html = buildCreditReadinessHtml(data, pdfLabels);
      const { uri } = await Print.printToFileAsync({ html });
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (Platform.OS === 'android' && FileSystem.StorageAccessFramework) {
        const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!perm.granted) {
          setDownloading(false);
          return;
        }
        const fileName = `CreditReadiness_${periodForDownload.startYearMonth}_to_${periodForDownload.endYearMonth}`;
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          perm.directoryUri,
          fileName,
          'application/pdf'
        );
        await FileSystem.StorageAccessFramework.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        Alert.alert(
          t('reportSaved'),
          t('reportSavedMessage')
        );
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: t('downloadReport'),
          });
        } else {
          Alert.alert(t('reportSaved'), `PDF: ${uri}`);
        }
      }
    } catch (err) {
      Alert.alert(t('error') || 'Error', (err as Error).message);
    } finally {
      setDownloading(false);
    }
  };

  const periodForDownload = period ?? getLastNMonthsRange(6);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('creditReadiness')} subtitle={t('creditSummaryForBanks')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Report period selection */}
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('reportPeriod')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodRow}>
            <TouchableOpacity
              style={[
                styles.periodChip,
                periodPreset === 'last6' && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => setPeriodPreset('last6')}
            >
              <Text style={[styles.periodChipText, { color: periodPreset === 'last6' ? colors.black : colors.textPrimary }]}>
                {t('last6MonthsOption')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodChip,
                periodPreset === 'last12' && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => setPeriodPreset('last12')}
            >
              <Text style={[styles.periodChipText, { color: periodPreset === 'last12' ? colors.black : colors.textPrimary }]}>
                {t('last12MonthsOption')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodChip,
                periodPreset === 'custom' && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => setPeriodPreset('custom')}
            >
              <Text style={[styles.periodChipText, { color: periodPreset === 'custom' ? colors.black : colors.textPrimary }]}>
                {t('customPeriodOption')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
          {periodPreset === 'custom' && (
            <View style={styles.customRow}>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.border }]}
                onPress={() => setShowFromPicker(true)}
              >
                <Text style={[styles.dateButtonLabel, { color: colors.textSecondary }]}>{t('fromMonthYear')}</Text>
                <Text style={[styles.dateButtonValue, { color: colors.textPrimary }]}>
                  {customStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: colors.border }]}
                onPress={() => setShowToPicker(true)}
              >
                <Text style={[styles.dateButtonLabel, { color: colors.textSecondary }]}>{t('toMonthYear')}</Text>
                <Text style={[styles.dateButtonValue, { color: colors.textPrimary }]}>
                  {customEnd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {showFromPicker && (
            <Modal transparent animationType="slide">
              <Pressable style={styles.modalOverlay} onPress={() => setShowFromPicker(false)}>
                <View style={[styles.pickerWrap, { backgroundColor: colors.surface }]}>
                  <DateTimePicker
                    value={customStart}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                      if (d) setCustomStart(d);
                      setShowFromPicker(false);
                    }}
                  />
                </View>
              </Pressable>
            </Modal>
          )}
          {showToPicker && (
            <Modal transparent animationType="slide">
              <Pressable style={styles.modalOverlay} onPress={() => setShowToPicker(false)}>
                <View style={[styles.pickerWrap, { backgroundColor: colors.surface }]}>
                  <DateTimePicker
                    value={customEnd}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(_, d) => {
                      if (d) setCustomEnd(d);
                      setShowToPicker(false);
                    }}
                  />
                </View>
              </Pressable>
            </Modal>
          )}
        </View>

        {/* Creditworthiness assessment – based on report data, transparent and truthful */}
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('creditworthinessAssessment')}</Text>
          <Text style={[styles.assessmentDisclaimer, { color: colors.textSecondary }]}>{t('creditworthinessDisclaimer')}</Text>
          <View style={[styles.assessmentVerdictRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.assessmentVerdictLabel, { color: colors.textSecondary }]}>{t('assessment')}</Text>
            <View style={styles.assessmentVerdictValue}>
              <View style={[styles.assessmentDot, { backgroundColor: assessment.verdict === 'creditworthy' ? colors.success : assessment.verdict === 'not_creditworthy' ? colors.error : assessment.verdict === 'needs_improvement' ? colors.warning : colors.textSecondary }]} />
              <Text style={[styles.assessmentVerdictText, { color: assessment.verdict === 'creditworthy' ? colors.success : assessment.verdict === 'not_creditworthy' ? colors.error : colors.textPrimary }]}>
                {t(`creditworthinessVerdict_${assessment.verdict}`)}
              </Text>
            </View>
          </View>
          {assessment.reasonKeys.length > 0 && (
            <View style={styles.reasonsWrap}>
              {assessment.reasonKeys.map((key) => (
                <View key={key} style={styles.reasonRow}>
                  <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
                  <Text style={[styles.reasonText, { color: colors.textPrimary }]}>{t(key)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{data.userName}</Text>
          <Text style={[styles.businessName, { color: colors.textSecondary }]}>{data.businessName || t('myBusiness')}</Text>
        </View>

        {cashFlowRows.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('cashFlowStatement')}</Text>
            <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>{t('period')}: {data.reportPeriodLabel}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
              <View style={styles.tableContainer}>
                <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.tableHeaderText, styles.tableDate, { color: colors.textSecondary }]}>{t('date') || 'Date'}</Text>
                  <Text style={[styles.tableHeaderText, styles.tableNum, { color: colors.textSecondary }]}>{t('cashIn')}</Text>
                  <Text style={[styles.tableHeaderText, styles.tableNum, { color: colors.textSecondary }]}>{t('cashOut')}</Text>
                  <Text style={[styles.tableHeaderText, styles.tableNum, { color: colors.textSecondary }]}>{t('net')}</Text>
                </View>
                {paginatedRows.map((r) => (
                  <View key={r.dateKey} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.tableCell, styles.tableDate, { color: colors.textPrimary }]} numberOfLines={1}>{r.dateLabel}</Text>
                    <Text style={[styles.tableCell, styles.tableNum, { color: colors.textPrimary }]} numberOfLines={1}>{formatRWF(r.income)}</Text>
                    <Text style={[styles.tableCell, styles.tableNum, { color: colors.textPrimary }]} numberOfLines={1}>{formatRWF(r.expense)}</Text>
                    <Text style={[styles.tableCell, styles.tableNum, { color: r.net >= 0 ? colors.success : colors.error }]} numberOfLines={1}>{formatRWF(r.net)}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
            {totalCashFlowPages > 1 && (
              <View style={[styles.paginationRow, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.paginationBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={() => setCashFlowPage((p) => Math.max(0, p - 1))}
                  disabled={cashFlowPage === 0}
                >
                  <Text style={[styles.paginationBtnText, { color: cashFlowPage === 0 ? colors.textSecondary : colors.textPrimary }]}>{t('previousPage')}</Text>
                </TouchableOpacity>
                <Text style={[styles.paginationInfo, { color: colors.textSecondary }]}>
                  {t('pageOf', { current: cashFlowPage + 1, total: totalCashFlowPages })}
                </Text>
                <TouchableOpacity
                  style={[styles.paginationBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={() => setCashFlowPage((p) => Math.min(totalCashFlowPages - 1, p + 1))}
                  disabled={cashFlowPage >= totalCashFlowPages - 1}
                >
                  <Text style={[styles.paginationBtnText, { color: cashFlowPage >= totalCashFlowPages - 1 ? colors.textSecondary : colors.textPrimary }]}>{t('nextPage')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('creditSummary')}</Text>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{t('cashFlowStability')}</Text>
            <View style={styles.rowValue}>
              <View style={[styles.dot, { backgroundColor: data.cashFlowStability === 'Good' ? colors.success : colors.error }]} />
              <Text style={[styles.rowText, { color: data.cashFlowStability === 'Good' ? colors.success : colors.error }]}>
                {data.cashFlowStability === 'Good' ? t('scoreGood') : t('needsImprovement')}
              </Text>
            </View>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{t('avgMonthlyIncome')}</Text>
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>{formatRWF(data.avgMonthlyIncome)}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{t('avgMonthlyExpense')}</Text>
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>{formatRWF(data.avgMonthlyExpense)}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{t('savingsRate')}</Text>
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>{data.savingsRate}%</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{t('transactionFrequency')}</Text>
            <Text style={[styles.rowText, { color: colors.textPrimary }]}>{data.transactionFrequency}{t('perMonthSuffix')}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('verificationStatus')}</Text>
          <View style={styles.verifyRow}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={[styles.verifyText, { color: colors.textPrimary }]}>{t('incomeVerification')}: {data.incomeVerification.period === 'Last 6 months' ? t('last6Months') : data.incomeVerification.period}</Text>
          </View>
          <View style={styles.verifyRow}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={[styles.verifyText, { color: colors.textPrimary }]}>{t('businessStability')}: {data.businessStability.period === '12 months active' ? t('monthsActive') : data.businessStability.period}</Text>
          </View>
        </View>

        <View style={styles.btnWrap}>
          <PrimaryButton
            title={downloading ? t('downloading') : t('downloadReport')}
            onPress={handleDownloadReport}
            disabled={downloading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  userName: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
  },
  businessName: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 16,
  },
  reportPeriodCard: {
    marginBottom: 16,
  },
  periodRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    flexShrink: 0,
  },
  periodChipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  customRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dateButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateButtonLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
  },
  dateButtonValue: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerWrap: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  periodLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  tableScroll: {
    marginHorizontal: -4,
  },
  tableContainer: {
    minWidth: 600,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
  },
  tableHeaderText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  tableDate: {
    width: 140,
    paddingRight: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  tableNum: {
    width: 120,
    textAlign: 'right',
    paddingLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  rowValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  verifyText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  btnWrap: {
    marginTop: 8,
  },
  assessmentDisclaimer: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  assessmentVerdictRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  assessmentVerdictLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  assessmentVerdictValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assessmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  assessmentVerdictText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  reasonsWrap: {
    marginTop: 12,
    gap: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.regular,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
  },
  paginationBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  paginationBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  paginationInfo: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
});
