// Business health: score, top spending, income chart.
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactions } from '../hooks/useTransactions';
import { useBusinessHealth } from '../hooks/useBusinessHealth';
import { ScreenHeader } from '../components/ScreenHeader';
import { CircularGauge } from '../components/CircularGauge';
import { ProgressBar } from '../components/ProgressBar';
import { PrimaryButton } from '../components/PrimaryButton';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { getBusinessHealthChartConfig } from '../constants/chartConfig';
import { formatRWF } from '../utils/formatCurrency';
import { translateCategory } from '../utils/translateCategory';
import { fetchHealthScoreFromServer } from '../services/cloudFunctionsService';
import type { HealthScoreResponse } from '../services/cloudFunctionsService';

function getScoreLabelKey(label: string): string {
  return label === 'Excellent' ? 'scoreExcellent' : label === 'Good' ? 'scoreGood' : label === 'Fair' ? 'scoreFair' : label === 'No data' ? 'scoreNoData' : 'scoreNeedsAttention';
}
export default function BusinessHealthScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const { transactions, loading } = useTransactions(userId || null);
  const data = useBusinessHealth(transactions);
  const [serverScore, setServerScore] = useState<HealthScoreResponse | null>(null);
  const [cachedScore, setCachedScore] = useState<HealthScoreResponse | null>(null);
  const [serverScoreLoading, setServerScoreLoading] = useState(true);
  const SCORE_CACHE_KEY = `@mobiflow/healthScoreCache/${userId || 'guest'}`;

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(SCORE_CACHE_KEY).then((raw) => {
      if (cancelled || !raw) return;
      try {
        const parsed = JSON.parse(raw) as HealthScoreResponse;
        if (
          typeof parsed?.score === 'number' &&
          typeof parsed?.label === 'string' &&
          typeof parsed?.message === 'string'
        ) {
          setCachedScore(parsed);
        }
      } catch {
        // Ignore invalid cache
      }
    });
    return () => {
      cancelled = true;
    };
  }, [SCORE_CACHE_KEY]);

  useEffect(() => {
    if (!userId) {
      setServerScoreLoading(false);
      return;
    }
    let cancelled = false;
    setServerScoreLoading(true);
    fetchHealthScoreFromServer().then((result) => {
      if (cancelled) return;
      if (result.ok && result.status === 200) {
        setServerScore(result.data);
        AsyncStorage.setItem(SCORE_CACHE_KEY, JSON.stringify(result.data)).catch(() => {});
      } else {
        setServerScore(null);
      }
      setServerScoreLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const effectiveScore = serverScore
    ? { score: serverScore.score, label: serverScore.label, message: serverScore.message }
    : cachedScore
      ? { score: cachedScore.score, label: cachedScore.label, message: cachedScore.message }
      : data.score;
  const scoreLabelKey = getScoreLabelKey(effectiveScore.label);
  const scoreMessage = effectiveScore.message;
  const gaugeColor =
    effectiveScore.label === 'Excellent' || effectiveScore.label === 'Good'
      ? colors.success
      : effectiveScore.label === 'Fair'
        ? colors.accent
        : effectiveScore.label === 'No data'
          ? colors.grayLight
          : colors.error;

  // Full amounts for bar labels
  const chartData = {
    labels: data.income6Months.map((i) => i.label),
    datasets: [{ data: data.income6Months.map((i) => Math.round(i.amount)) }],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('businessHealth')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.gaugeWrap}>
          <CircularGauge
            value={effectiveScore.score}
            label={t(scoreLabelKey)}
            color={gaugeColor}
          />
          <Text style={[styles.scoreMessage, { color: effectiveScore.label === 'No data' ? colors.textSecondary : colors.textPrimary }]}>
            {scoreMessage}
          </Text>
          {serverScoreLoading && !serverScore && !cachedScore ? (
            <View style={styles.scoreSyncRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.scoreLoadingText, { color: colors.textSecondary }]}>
                {t('updatingHealthScore')}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('topSpending')}</Text>
          {data.topSpending.map((s) => (
            <View key={s.name} style={[styles.categoryRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{translateCategory(s.name, t)}</Text>
              <View style={styles.categoryBarWrap}>
                <ProgressBar progress={s.percent} color={s.color} height={8} />
              </View>
              <Text style={[styles.categoryPercent, { color: colors.textSecondary }]}>{s.percent}%</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('income6Months')}</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSquare, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('income')}</Text>
            </View>
          </View>
          <View style={styles.chartWrap}>
            <BarChart
              showBarTops={true}
              showValuesOnTopOfBars={false}
              data={chartData}
              width={Dimensions.get('window').width - 80}
              height={180}
              chartConfig={getBusinessHealthChartConfig(colors)}
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

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('financialSummary')}</Text>
          {data.summary.map((row) => (
            <View key={row.label} style={[styles.summaryRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {row.label === 'Cash flow' ? t('cashFlow') : row.label}
              </Text>
              <Text
                style={[
                  styles.summaryValue,
                  {
                    color:
                      row.good === true ? colors.success : row.good === false ? colors.error : colors.textPrimary,
                  },
                ]}>
                {row.value === 'Good' ? t('scoreGood') : row.value === 'Negative' ? t('negative') : row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.btnWrap}>
          <PrimaryButton title={t('viewTips')} onPress={() => router.push('/business-health-tips')} />
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
  gaugeWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  scoreMessage: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: 12,
    textAlign: 'center',
  },
  scoreSyncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  scoreLoadingText: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
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
    marginBottom: 12,
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
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  btnWrap: {
    marginTop: 8,
  },
});
