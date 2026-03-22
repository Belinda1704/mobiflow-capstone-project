// Sign up: phone, password, terms. On success dashboard asks for SMS/notif once.
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSignUp } from '../hooks/useSignUp';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthInput } from '../components/AuthInput';
import { PasswordRequirementsDisplay } from '../components/PasswordRequirements';
import { usePhoneInput } from '../hooks/usePhoneInput';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { getPasswordRequirements } from '../utils/passwordStrength';

// Flag for dashboard to show permission prompts once
const SHOW_PERMISSIONS_ON_DASHBOARD_KEY = '@mobiflow/showPermissionsOnDashboard';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslations();
  const { colors, isDark } = useThemeColors();
  const { value: phone, onChangeText: setPhone } = usePhoneInput();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const hasConfirmPassword = confirmPassword.trim().length > 0;
  const passwordsMatch = hasConfirmPassword && password === confirmPassword;

  const { signUp, loading } = useSignUp();

  async function handleCreateAccount() {
    const ok = await signUp(phone, password, confirmPassword);
    if (ok) {
      await AsyncStorage.setItem(SHOW_PERMISSIONS_ON_DASHBOARD_KEY, 'true');
      router.replace('/(tabs)');
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} collapsable={false}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={[styles.safe, { paddingTop: insets.top + 16, backgroundColor: colors.background }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('hello')}</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('createAccount')}</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              {t('trackIncomeExpensesTagline')}
            </Text>

            <AuthInput
              placeholder="781234567"
              value={phone}
              onChangeText={setPhone}
              icon="phone"
              keyboardType="phone-pad"
              showCountryPrefix={true}
            />
            <AuthInput
              placeholder={t('createPassword')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon="lock"
              showEye
              onEyePress={() => setShowPassword(!showPassword)}
              eyeOpen={showPassword}
            />
            <PasswordRequirementsDisplay requirements={getPasswordRequirements(password)} />
            <AuthInput
              placeholder={t('verifyPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              icon="lock"
              showEye
              onEyePress={() => setShowConfirm(!showConfirm)}
              eyeOpen={showConfirm}
            />
            {hasConfirmPassword ? (
              <View style={styles.matchRow}>
                <Ionicons
                  name={passwordsMatch ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={passwordsMatch ? colors.success : colors.error}
                  style={styles.matchIcon}
                />
                <Text
                  style={[
                    styles.matchText,
                    { color: passwordsMatch ? colors.success : colors.error },
                  ]}>
                  {passwordsMatch ? t('passwordsMatch') : t('signupPasswordsDoNotMatch')}
                </Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.7}>
              <Ionicons
                name={agreedToTerms ? 'checkmark-circle' : 'ellipse-outline'}
                size={22}
                color={agreedToTerms ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.termsText, { color: colors.textPrimary }]}>
                {t('agreeToTermsAndPrivacyPrefix')}{' '}
                <Text style={[styles.termsLink, { color: colors.accent }]} onPress={() => router.push('/terms')}>{t('termsOfService')}</Text>
                {' '}{t('and')}{' '}
                <Text style={[styles.termsLink, { color: colors.accent }]} onPress={() => router.push('/privacy')}>{t('privacyPolicy')}</Text>
              </Text>
            </TouchableOpacity>

            <PrimaryButton
              title={loading ? t('creatingAccount') : t('createAccount')}
              onPress={handleCreateAccount}
              variant="yellow"
              disabled={!agreedToTerms}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('alreadyHaveAccount')}</Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={[styles.link, { color: colors.accent }]}>{t('signIn')}</Text>
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
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: { fontSize: 15, fontFamily: FontFamily.regular },
  link: { fontSize: 15, fontFamily: FontFamily.semiBold },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
  },
  termsText: { fontSize: 14, fontFamily: FontFamily.regular, flex: 1, lineHeight: 20 },
  termsLink: { fontFamily: FontFamily.semiBold, textDecorationLine: 'underline' },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
    marginBottom: 12,
  },
  matchIcon: {
    marginRight: 8,
  },
  matchText: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  successCard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    marginBottom: 32,
  },
  backToSignIn: {
    marginTop: 16,
    alignItems: 'center',
  },
  backToSignInText: { fontSize: 14, fontFamily: FontFamily.medium },
});
