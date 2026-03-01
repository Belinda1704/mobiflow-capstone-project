// Login – phone + password, then go to dashboard
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { useSignIn } from '../hooks/useSignIn';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthInput } from '../components/AuthInput';
import { usePhoneInput } from '../hooks/usePhoneInput';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColors();
  const { t } = useTranslations();
  const { value: phone, onChangeText: setPhone } = usePhoneInput();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, loading } = useSignIn();

  useAuthRedirect(() => router.replace('/(tabs)'));

  async function handleSignIn() {
    const success = await signIn(phone, password);
    if (success) router.replace('/(tabs)');
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
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{t('welcomeBack')}</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{t('signIn')}</Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              {t('trackIncomeExpenses')}
            </Text>

            <AuthInput
              placeholder="781234567"
              value={phone}
              onChangeText={setPhone}
              icon="phone"
              keyboardType="phone-pad"
              showCountryPrefix={true}
              testID="login-phone-input"
            />
            <AuthInput
              placeholder={t('enterPassword')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon="lock"
              showEye
              onEyePress={() => setShowPassword(!showPassword)}
              eyeOpen={showPassword}
              testID="login-password-input"
            />

            <TouchableOpacity style={styles.forgotWrap} onPress={() => router.push('/forgot-password')}>
              <Text style={[styles.forgot, { color: colors.accent }]}>{t('forgotPassword')}</Text>
            </TouchableOpacity>

            <PrimaryButton title={loading ? t('signingIn') : t('signIn')} onPress={handleSignIn} variant="yellow" testID="login-sign-in-button" />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('newHere')} </Text>
            <TouchableOpacity onPress={() => router.push('/signup')} testID="login-create-account">
              <Text style={[styles.link, { color: colors.accent }]}>{t('createAccount')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scroll: {
    paddingTop: 0,
    paddingBottom: 40,
  },
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgot: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  link: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
});
