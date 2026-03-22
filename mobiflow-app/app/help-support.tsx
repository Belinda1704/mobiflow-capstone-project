// Help: FAQs and contact email.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { SUPPORT_EMAIL } from '../constants/support';

export default function HelpSupportScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  function openEmail() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('helpSupport')} subtitle={t('helpSupportSubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('faqTitle')}</Text>
        <Text style={[styles.question, { color: colors.textPrimary }]}>{t('faqAddTransactionQ')}</Text>
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{t('faqAddTransactionA')}</Text>
        <Text style={[styles.question, { color: colors.textPrimary }]}>{t('faqChangePasswordQ')}</Text>
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{t('faqChangePasswordA')}</Text>
        <Text style={[styles.question, { color: colors.textPrimary }]}>{t('faqDataSecureQ')}</Text>
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{t('faqDataSecureA')}</Text>
        <Text style={[styles.question, { color: colors.textPrimary }]}>{t('faqSmsCaptureQ')}</Text>
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{t('faqSmsCaptureA')}</Text>
        <Text style={[styles.question, { color: colors.textPrimary }]}>{t('faqAnomalyQ')}</Text>
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{t('faqAnomalyA')}</Text>
        <Text style={[styles.question, { color: colors.textPrimary }]}>{t('faqBackupQ')}</Text>
        <Text style={[styles.answer, { color: colors.textSecondary }]}>{t('faqBackupA')}</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('contactUsTitle')}</Text>
        <TouchableOpacity onPress={openEmail} style={styles.emailRow}>
          <Text style={[styles.email, { color: colors.textPrimary }]}>{SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
        <Text style={[styles.contactNote, { color: colors.textSecondary }]}>{t('contactUsNote')}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 16, fontFamily: FontFamily.semiBold, marginTop: 20, marginBottom: 12 },
  question: { fontSize: 14, fontFamily: FontFamily.semiBold, marginTop: 12 },
  answer: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22, marginTop: 4 },
  emailRow: { marginTop: 8, paddingVertical: 12 },
  email: { fontSize: 15, fontFamily: FontFamily.semiBold },
  contactNote: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 4 },
});
