// Terms of service.
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

export default function TermsScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('termsOfService')} subtitle={t('termsSubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          {t('termsIntro')}
        </Text>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>{t('termsUseOfApp')}</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          {t('termsUseOfAppBody')}
        </Text>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>{t('termsYourData')}</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          {t('termsYourDataBody')}
        </Text>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>{t('termsAcceptableUse')}</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          {t('termsAcceptableUseBody')}
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          {t('termsContact')}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  heading: { fontSize: 16, fontFamily: FontFamily.semiBold, marginTop: 20, marginBottom: 8 },
  paragraph: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22 },
});
