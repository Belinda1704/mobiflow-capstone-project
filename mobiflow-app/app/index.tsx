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

const ONBOARDING_KEY = 'hasCompletedOnboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslations();
  const [checking, setChecking] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const init = async () => {
      const hasCompleted = (await AsyncStorage.getItem(ONBOARDING_KEY)) === 'true';
      setHasCompletedOnboarding(hasCompleted);
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
