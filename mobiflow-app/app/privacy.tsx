// Privacy: what data is stored, link to device permissions.
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

export default function PrivacyScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('privacy')} subtitle={t('privacySubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('privacySectionYourData')}</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{t('privacyYourDataBody')}</Text>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('privacySectionSms')}</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{t('privacySmsBody')}</Text>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('privacySectionCloudPrivacy')}</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{t('privacyCloudPrivacyBody')}</Text>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('privacySectionPermissions')}</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{t('privacyPermissionsBody')}</Text>

        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('privacySectionExportDelete')}</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>{t('privacyExportDeleteBody')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 16, fontFamily: FontFamily.semiBold, marginTop: 20, marginBottom: 8 },
  paragraph: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22 },
});
