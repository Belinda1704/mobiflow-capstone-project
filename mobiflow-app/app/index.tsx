// first screen - onboarding or redirect to login/tabs
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { auth } from '../config/firebase';
import { PrimaryButton } from '../components/PrimaryButton';
import { OnboardingColors, FontFamily } from '../constants/colors';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let unsubAuth: (() => void) | undefined;

    const init = async () => {
      const hasCompleted = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (hasCompleted === 'true') {
        unsubAuth = onAuthStateChanged(auth, (user) => {
          if (user) router.replace('/(tabs)');
          else router.replace('/login');
        });
      }
      setChecking(false);
    };

    init();
    return () => unsubAuth?.();
  }, [router]);

  const handleGetStarted = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.push('/signup');
  };

  const handleSignIn = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.push('/login');
  };

  if (checking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={OnboardingColors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={[styles.safe, { paddingTop: insets.top }]} collapsable={false}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 48 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.heroSection}>
            <Image
              source={require('../assets/images/onboarding.png')}
              style={styles.heroImage}
              contentFit="contain"
              priority="high"
              cachePolicy="memory-disk"
              transition={200}
            />
          </View>
          <View style={styles.contentSection}>
            <Text style={styles.headline}>Smart mobile money tracking for your business.</Text>
            <Text style={styles.body}>
              MobiFlow converts MTN MoMo and Airtel Money SMS into clear financial
              insights. Monitor sales, track expenses, and understand your cash flow
              all in one place.
            </Text>
            <PrimaryButton
              title="Get Started"
              onPress={handleGetStarted}
              variant="yellow"
            />
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleSignIn}>
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  heroSection: {
    width: '100%',
    backgroundColor: OnboardingColors.background,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 28,
    minHeight: 350,
    maxHeight: 450,
  },
  heroImage: {
    width: '100%',
    flex: 1,
  },
  contentSection: {
    paddingHorizontal: 28,
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
    marginBottom: 28,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
