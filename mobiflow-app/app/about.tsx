// About: description, version, terms, contact.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { SUPPORT_EMAIL } from '../constants/support';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  function openTerms() {
    router.push('/terms');
  }

  function openPrivacy() {
    router.push('/privacy');
  }

  function openSupportEmail() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('aboutMobiFlow')} subtitle={t('versionTerms')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <View style={[styles.versionCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>MobiFlow</Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>{t('version')} {VERSION}</Text>
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{t('aboutDescription')}</Text>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={openTerms}>
          <Text style={[styles.linkText, { color: colors.textPrimary }]}>{t('termsOfService')}</Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={openPrivacy}>
          <Text style={[styles.linkText, { color: colors.textPrimary }]}>{t('privacyPolicy')}</Text>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: colors.border }]} onPress={openSupportEmail}>
          <View>
            <Text style={[styles.linkText, { color: colors.textPrimary }]}>{t('contactSupportEmail')}</Text>
            <Text style={[styles.linkSubtitle, { color: colors.textSecondary }]}>{t('contactSupportEmailSubtitle')}</Text>
          </View>
          <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  versionCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 24,
  },
  appName: { fontSize: 22, fontFamily: FontFamily.bold },
  version: { fontSize: 13, fontFamily: FontFamily.medium, marginTop: 12 },
  description: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  linkText: { fontSize: 15, fontFamily: FontFamily.medium },
  linkSubtitle: { fontSize: 12, fontFamily: FontFamily.regular, marginTop: 2 },
  chevron: { fontSize: 18, fontFamily: FontFamily.regular },
});
