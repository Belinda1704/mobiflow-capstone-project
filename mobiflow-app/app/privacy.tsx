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
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('privacy')} subtitle={t('privacySubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Your data</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          MobiFlow stores your transaction data in secure cloud storage (Firebase on Google Cloud). Your account is
          protected by your login, and your financial data is only used to provide app features like reports and
          insights. We do not sell your data or share it with third parties for marketing.
        </Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>SMS access</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          If you turn on auto-capture, MobiFlow reads MTN MoMo and Airtel Money SMS on your device to detect transfers
          and payments. We use these messages only to create transactions in your account. You can turn auto-capture off
          in Settings and you can revoke SMS permissions at any time in your device settings.
        </Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Permissions</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          The app may request access to device storage for exporting reports and backing up data, and to notifications
          for alerts and reminders. You can revoke these permissions at any time in your device settings; the app will
          continue to work, but some features may be limited.
        </Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Data export & deletion</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          You can export your transactions and reports from the Data & storage screen. You can also delete your data
          from Settings (Delete all transactions or Delete account). When you delete data from the app, it is removed
          from our servers and cannot be recovered.
        </Text>
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
