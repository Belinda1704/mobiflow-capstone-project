// How to use MobiFlow – step-by-step guide
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; titleKey: string; bodyKey: string }[] = [
  { icon: 'person-add-outline', titleKey: 'tutorialStep1Title', bodyKey: 'tutorialStep1Body' },
  { icon: 'home-outline', titleKey: 'tutorialStep2Title', bodyKey: 'tutorialStep2Body' },
  { icon: 'add-circle-outline', titleKey: 'tutorialStep3Title', bodyKey: 'tutorialStep3Body' },
  { icon: 'chatbubble-outline', titleKey: 'tutorialStep4Title', bodyKey: 'tutorialStep4Body' },
  { icon: 'bar-chart-outline', titleKey: 'tutorialStep5Title', bodyKey: 'tutorialStep5Body' },
  { icon: 'ellipsis-horizontal', titleKey: 'tutorialStep6Title', bodyKey: 'tutorialStep6Body' },
];

export default function HowToUseScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('howToUseMobiFlow')} subtitle={t('howToUseSubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{t('howToUseIntro')}</Text>
        {STEPS.map((step, i) => (
          <View key={i} style={[styles.stepCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={[styles.stepNum, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.stepNumText, { color: colors.listIcon ?? colors.primary }]}>{i + 1}</Text>
            </View>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name={step.icon} size={22} color={colors.listIcon ?? colors.primary} />
            </View>
            <View style={styles.stepBody}>
              <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>{t(step.titleKey)}</Text>
              <Text style={[styles.stepBodyText, { color: colors.textSecondary }]}>{t(step.bodyKey)}</Text>
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
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 14, fontFamily: FontFamily.bold },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: { flex: 1 },
  stepTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  stepBodyText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 21,
  },
});
