// Root layout: fonts, language, then app. Notifications only in real build (not Expo Go).
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useThemeColors } from '../contexts/ThemeContext';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import 'react-native-reanimated';

import { AppProviders } from '../components/AppProviders';
import { createSmsCaptureChannel } from '../services/smsForegroundService';

// SMS foreground service (Android, not Expo Go).
if (Platform.OS === 'android' && Constants.appOwnership !== 'expo') {
  try {
    const notifee = require('@notifee/react-native').default;
    notifee.registerForegroundService(() => {
      return new Promise(() => {});
    });
    createSmsCaptureChannel().catch(() => {});
  } catch (_e) {
    // Prebuild not run or Expo Go
  }
}

// Notification behaviour when they arrive (real build only)
if (Constants.appOwnership !== 'expo') {
  try {
    const NotificationsModule = require('expo-notifications');
    if (NotificationsModule?.default) {
      NotificationsModule.default.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
  } catch (error) {
    // Expo Go or notifications unavailable
  }
}
import { initI18n } from '../i18n';

SplashScreen.preventAutoHideAsync();

function ThemeAwareStatusBar() {
  const { isDark } = useThemeColors();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && i18nReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, i18nReady]);

  if (!fontsLoaded || !i18nReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppProviders>
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="account" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="alerts" />
        <Stack.Screen name="data-storage" />
        <Stack.Screen name="sms-capture" />
        <Stack.Screen name="help-support" />
        <Stack.Screen name="about" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="manage-profile" />
        <Stack.Screen name="security" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="add-transaction" />
        <Stack.Screen name="business-health" />
        <Stack.Screen name="business-insights" />
        <Stack.Screen name="savings-budget-goals" />
        <Stack.Screen name="top-customers" />
        <Stack.Screen name="credit-readiness" />
        <Stack.Screen name="how-to-use" />
        <Stack.Screen name="financial-literacy" />
        <Stack.Screen name="financial-video" />
        </Stack>
        <ThemeAwareStatusBar />
      </AppProviders>
    </SafeAreaProvider>
  );
}
