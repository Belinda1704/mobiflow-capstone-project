// More: categories, health, goals, insights, how-to, financial literacy.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TabHeader } from '../../components/TabHeader';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useTranslations } from '../../hooks/useTranslations';
import { FontFamily } from '../../constants/colors';

const MORE_ITEMS: { labelKey: string; subtitleKey: string; icon: React.ComponentProps<typeof Ionicons>['name']; route: string }[] = [
  { labelKey: 'settings', subtitleKey: 'settingsSubtitle', icon: 'settings-outline', route: '/settings' },
  { labelKey: 'manageCategories', subtitleKey: 'manageCategoriesSubtitle', icon: 'pricetags-outline', route: '/categories' },
  { labelKey: 'businessHealth', subtitleKey: 'businessHealthSubtitle', icon: 'heart-outline', route: '/business-health' },
  { labelKey: 'savingsBudgetGoals', subtitleKey: 'savingsBudgetGoalsSubtitle', icon: 'wallet-outline', route: '/savings-budget-goals' },
  { labelKey: 'businessInsights', subtitleKey: 'businessInsightsSubtitle', icon: 'analytics-outline', route: '/business-insights' },
  { labelKey: 'creditReadiness', subtitleKey: 'creditReadinessSubtitle', icon: 'card-outline', route: '/credit-readiness' },
  { labelKey: 'howToUseMobiFlow', subtitleKey: 'howToUseSubtitle', icon: 'play-circle-outline', route: '/how-to-use' },
  { labelKey: 'financialLiteracy', subtitleKey: 'financialLiteracySubtitle', icon: 'school-outline', route: '/financial-literacy' },
];

export default function MoreScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <TabHeader title={t('more')} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {MORE_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.labelKey}
            style={[styles.row, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name={item.icon} size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t(item.labelKey).toUpperCase()}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{t(item.subtitleKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
});
