// First screen: onboarding or redirect to login/tabs.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { useTranslations } from '../hooks/useTranslations';
import { PrimaryButton } from '../components/PrimaryButton';
import { OnboardingColors, FontFamily } from '../constants/colors';
import { getLanguage } from '../services/preferencesService';
import type { LanguageOption } from '../services/preferencesService';
import { changeAppLanguage } from '../i18n';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

function getLangLabels(t: (k: string) => string): Record<LanguageOption, string> {
  return { en: t('english'), rw: t('kinyarwanda') };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslations();
  const [checking, setChecking] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [language, setLanguage] = useState<LanguageOption>('en');

  useEffect(() => {
    const init = async () => {
      const hasCompleted = (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
      setHasCompletedOnboarding(hasCompleted);
      const lang = await getLanguage();
      setLanguage(lang);
      setChecking(false);
    };
    init();
  }, []);

  useAuthRedirect(
    () => router.replace('/(tabs)'),
    () => router.replace('/login'),
    checking || !hasCompletedOnboarding
  );

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.push('/signup');
  };

  const handleSignIn = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.push('/login');
  };

  if (checking) {
    return null;
  }

  // User opened app before: show splash until we redirect to dashboard.
  if (hasCompletedOnboarding) {
    return (
      <View style={styles.splashWrap}>
        <StatusBar style="light" />
        <Image source={require('../assets/images/app-icon.png')} style={styles.splashLogo} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.safe, { paddingTop: insets.top }]} collapsable={false}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 40) + 56 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.brandRow}>
            <Image
              source={require('../assets/images/app-icon.png')}
              style={styles.brandLogo}
            />
            <Text style={styles.brandName}>MobiFlow</Text>
          </View>

          <View style={styles.topCopy}>
            <Text style={styles.headline}>{t('onboardingHeadline')}</Text>
          </View>

          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>{t('language')}</Text>
            <View style={styles.languageRow}>
              {(['en', 'rw'] as LanguageOption[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.languagePill, language === lang && styles.languagePillActive]}
                  onPress={async () => {
                    await changeAppLanguage(lang);
                    setLanguage(lang);
                  }}
                  activeOpacity={0.8}>
                  <Text style={[styles.languagePillText, language === lang && styles.languagePillTextActive]}>
                    {getLangLabels(t)[lang]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.heroSection}>
            <Image
              source={require('../assets/images/onboarding.png')}
              style={styles.heroImage}
              contentFit="cover"
              priority="high"
              cachePolicy="memory-disk"
              transition={200}
            />
          </View>

          <View style={styles.bottomContent}>
            <Text style={styles.body}>
              {t('onboardingBody')}
            </Text>
            <PrimaryButton
              title={t('getStarted')}
              onPress={handleGetStarted}
              variant="yellow"
              testID="onboarding-get-started"
            />
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('alreadyHaveAccount')}</Text>
              <TouchableOpacity onPress={handleSignIn} testID="onboarding-sign-in">
                <Text style={styles.link}>{t('signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashWrap: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  container: {
    flex: 1,
    backgroundColor: OnboardingColors.background,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingTop: 0,
    paddingBottom: 0,
    flexGrow: 1,
  },
  topCopy: {
    paddingHorizontal: 28,
    marginBottom: 16,
    alignItems: 'center',
  },
  languageSection: {
    paddingHorizontal: 28,
    marginBottom: 20,
    alignItems: 'center',
  },
  languageLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: OnboardingColors.textSecondary,
    marginBottom: 10,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  languagePill: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: OnboardingColors.textSecondary + '60',
    backgroundColor: 'transparent',
  },
  languagePillActive: {
    borderColor: OnboardingColors.link,
    backgroundColor: OnboardingColors.link + '20',
  },
  languagePillText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: OnboardingColors.textSecondary,
  },
  languagePillTextActive: {
    color: OnboardingColors.link,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  brandLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
  },
  brandName: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: OnboardingColors.textPrimary,
  },
  heroSection: {
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
  },
  heroImage: {
    width: 260,
    height: 260,
    borderRadius: 24,
  },
  bottomContent: {
    paddingHorizontal: 28,
    gap: 28,
    alignItems: 'stretch',
  },
  headline: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: OnboardingColors.textPrimary,
    marginBottom: 14,
    textAlign: 'center',
    lineHeight: 32,
  },
  body: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: OnboardingColors.textSecondary,
    lineHeight: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: OnboardingColors.textSecondary,
  },
  link: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: OnboardingColors.link,
  },
});
