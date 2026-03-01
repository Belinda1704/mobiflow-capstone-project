// Business insights: top spending, income trend, forecast, export PDF.
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactions } from '../hooks/useTransactions';
import { useBusinessInsights } from '../hooks/useBusinessInsights';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProgressBar } from '../components/ProgressBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { getBusinessInsightsChartConfig } from '../constants/chartConfig';
import { formatRWF, formatRWFWithSign } from '../utils/formatCurrency';
import { translateCategory } from '../utils/translateCategory';
import { buildInsightsHtml } from '../utils/insightsPdf';

export default function BusinessInsightsScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const { transactions, loading } = useTransactions(userId || null);
  const data = useBusinessInsights(transactions);
  const [exporting, setExporting] = useState(false);
  
  // Auth redirect handles
  if (!userId) {
    return null; // Auth redirect will handle navigation
  }

  const incomeTrendFootnote =
    data.incomeChangePercent >= 0
      ? t('upVsLastMonth', { percent: Math.abs(data.incomeChangePercent) })
      : t('downVsLastMonth', { percent: Math.abs(data.incomeChangePercent) });

  const handleExportInsights = async () => {
    try {
      setExporting(true);
      const html = buildInsightsHtml(data, {
        businessInsights: t('businessInsights'),
        businessInsightsSubtitle: t('businessInsightsSubtitle'),
        topSpendingCategories: t('topSpendingCategories'),
        category: t('category'),
        share: t('shareOfSpending'),
        incomeTrend30Days: t('incomeTrend30Days'),
        incomeTrendFootnote,
        nextMonthForecast: t('nextMonthForecast'),
        income: t('income'),
        expense: t('expense'),
        net: t('net'),
        generatedBy: t('generatedBy'),
      });
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: t('exportInsights'),
        });
      } else {
        Alert.alert(t('exportInsights'), `PDF saved: ${uri}`);
      }
    } catch (err) {
      Alert.alert(t('error') || 'Error', (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  // Data from cache
  const chartData = {
    labels: data.incomeTrend30Days.map((i) => i.label),
    datasets: [{ data: data.incomeTrend30Days.map((i) => Math.round(i.amount / 1000)) }],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('businessInsights')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('topSpendingCategories')}</Text>
          {data.topSpending.map((s) => (
            <View key={s.name} style={styles.categoryRow}>
              <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{translateCategory(s.name, t)}</Text>
              <View style={styles.categoryBarWrap}>
                <ProgressBar
                  progress={s.percent}
                  color={s.color}
                  height={8}
                />
              </View>
              <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>{s.percent}%</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('incomeTrend30Days')}</Text>
          <View style={styles.chartWrap}>
            <BarChart
              showBarTops={true}
              showValuesOnTopOfBars={false}
              data={chartData}
              width={Dimensions.get('window').width - 80}
              height={180}
              chartConfig={getBusinessInsightsChartConfig(colors)}
              yAxisLabel=""
              yAxisSuffix=""
              withHorizontalLabels={false}
              withInnerLines={true}
              fromZero
              style={styles.chart}
            />
          </View>
          <Text style={[styles.chartFootnote, { color: colors.textSecondary }]}>
            {data.incomeChangePercent >= 0
              ? t('upVsLastMonth', { percent: Math.abs(data.incomeChangePercent) })
              : t('downVsLastMonth', { percent: Math.abs(data.incomeChangePercent) })}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('nextMonthForecast')}</Text>
          <Text style={[styles.forecastRow, { color: colors.textPrimary }]}>{t('income')} {formatRWF(data.forecast.income)}</Text>
          <Text style={[styles.forecastRow, { color: colors.textPrimary }]}>{t('expense')} {formatRWF(data.forecast.expense)}</Text>
          <Text
            style={[
              styles.forecastNet,
              { color: data.forecast.net >= 0 ? colors.success : colors.error },
            ]}>
            {t('net')} {formatRWFWithSign(data.forecast.net)}
          </Text>
          <Text style={[styles.forecastFootnote, { color: colors.textSecondary }]}>{t('basedOnYourPatterns')}</Text>
        </View>

        <View style={styles.btnWrap}>
          <PrimaryButton
            title={exporting ? (t('exporting') || 'Exporting...') : t('downloadInsights')}
            onPress={handleExportInsights}
            disabled={exporting}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  cardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  categoryBarWrap: {
    flex: 2,
  },
  categoryPercent: {
    width: 36,
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    textAlign: 'right',
  },
  chartWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 8,
  },
  chartFootnote: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  forecastRow: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
  },
  forecastNet: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    marginTop: 4,
  },
  forecastFootnote: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 8,
  },
  btnWrap: {
    marginTop: 8,
  },
});
