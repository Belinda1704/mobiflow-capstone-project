// Business health tips list.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

type TipAction = {
  labelKey: string;
  route?: string;
  onPress?: () => void;
};

const TIP_KEYS: Array<{
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  bodyKey: string;
  benefitKey: string;
  action?: TipAction;
}> = [
  {
    icon: 'add-circle-outline',
    titleKey: 'tipTrackIncome',
    bodyKey: 'tipTrackIncomeBody',
    benefitKey: 'tipTrackIncomeBenefit',
    action: { labelKey: 'tipActionAddTransaction', route: '/add-transaction' },
  },
  {
    icon: 'wallet-outline',
    titleKey: 'tipBuildReserve',
    bodyKey: 'tipBuildReserveBody',
    benefitKey: 'tipBuildReserveBenefit',
    action: { labelKey: 'tipActionSetGoal', route: '/savings-budget-goals' },
  },
  {
    icon: 'pricetag-outline',
    titleKey: 'tipSeparateSpending',
    bodyKey: 'tipSeparateSpendingBody',
    benefitKey: 'tipSeparateSpendingBenefit',
  },
  {
    icon: 'notifications-outline',
    titleKey: 'tipLowBalanceAlerts',
    bodyKey: 'tipLowBalanceAlertsBody',
    benefitKey: 'tipLowBalanceAlertsBenefit',
    action: { labelKey: 'tipActionSetAlert', route: '/alerts' },
  },
  {
    icon: 'document-text-outline',
    titleKey: 'tipReviewReports',
    bodyKey: 'tipReviewReportsBody',
    benefitKey: 'tipReviewReportsBenefit',
    action: { labelKey: 'tipActionViewReports', route: '/(tabs)/reports' },
  },
  {
    icon: 'arrow-up-circle-outline',
    titleKey: 'tipImproveCashFlow',
    bodyKey: 'tipImproveCashFlowBody',
    benefitKey: 'tipImproveCashFlowBenefit',
  },
];

export default function BusinessHealthTipsScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('businessHealthTips')} subtitle={t('improveFinancialHealth')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          {t('businessHealthTipsIntro')}
        </Text>
        {TIP_KEYS.map((tip, i) => (
          <View key={i} style={[styles.tipCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name={tip.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.tipBody}>
              <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>{t(tip.titleKey)}</Text>
              <Text style={[styles.tipBodyText, { color: colors.textSecondary }]}>{t(tip.bodyKey)}</Text>
              <View style={[styles.benefitBox, { backgroundColor: colors.background }]}>
                <Ionicons name="checkmark-circle" size={16} color={colors.textPrimary} />
                <Text style={[styles.benefitText, { color: colors.textPrimary }]}>{t(tip.benefitKey)}</Text>
              </View>
              {tip.action && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    if (tip.action?.route) {
                      router.push(tip.action.route as any);
                    } else if (tip.action?.onPress) {
                      tip.action.onPress();
                    }
                  }}>
                  <Text style={[styles.actionButtonText, { color: colors.black }]}>{t(tip.action.labelKey)}</Text>
                  <Ionicons name="arrow-forward" size={16} color={colors.black} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  intro: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 14,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tipBody: { flex: 1 },
  tipTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
    lineHeight: 22,
  },
  tipBodyText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 20,
    marginBottom: 10,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    flex: 1,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
});
