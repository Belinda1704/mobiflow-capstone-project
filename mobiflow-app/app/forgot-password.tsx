// Forgot password: reset link or contact support.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { PrimaryButton } from '../components/PrimaryButton';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { SUPPORT_EMAIL } from '../constants/support';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslations();
  const { colors, isDark } = useThemeColors();

  function handleContactSupport() {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]} collapsable={false}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.safe, { paddingTop: insets.top + 16, backgroundColor: colors.surfaceElevated }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <View style={styles.iconWrap}>
              <Ionicons name="key-outline" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('forgotPassword')}</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('resetYourPassword')}</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              {t('forgotPasswordTagline')}
            </Text>

            <View style={[styles.infoBox, { backgroundColor: colors.background, borderLeftColor: colors.primary }]}>
              <Ionicons name="information-circle-outline" size={22} color={colors.primary} style={styles.infoIcon} />
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>
                {t('contactSupportInfo')}
              </Text>
            </View>

            <PrimaryButton
              title={t('contactSupport')}
              onPress={handleContactSupport}
              variant="yellow"
            />

            <Text style={[styles.orLabel, { color: colors.textSecondary }]}>{t('orSendEmailTo')}</Text>
            <TouchableOpacity onPress={handleContactSupport} style={styles.emailWrap}>
              <Text style={[styles.email, { color: colors.textPrimary }]}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backWrap}>
              <Ionicons name="arrow-back" size={18} color={colors.primary} style={styles.backIcon} />
              <Text style={[styles.link, { color: colors.textPrimary }]}>{t('backToSignIn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: 24 },
  scroll: { paddingTop: 0, paddingBottom: 40 },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 0,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 21,
  },
  orLabel: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  emailWrap: {
    alignItems: 'center',
  },
  email: { fontSize: 15, fontFamily: FontFamily.semiBold },
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  backWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    marginRight: 6,
  },
  link: { fontSize: 15, fontFamily: FontFamily.semiBold },
});
