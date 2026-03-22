// Root layout: fonts, language, app.
import { useEffect, useLayoutEffect, useState } from 'react';
import { Platform, StatusBar as RNStatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
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

// SMS foreground service on Android.
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

// How notifications are shown when they arrive
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
import { getFriendlyAuthErrorMessage } from '../utils/authErrorUtils';

// Show a clearer message when token refresh is blocked (e.g. app not set up in Firebase).
const setupAuthErrorHandler = () => {
  const g = typeof globalThis !== 'undefined' ? globalThis : typeof global !== 'undefined' ? global : undefined;
  if (!g || typeof (g as any).addEventListener !== 'function') return;
  const handler = (event: PromiseRejectionEvent) => {
    const msg = (event?.reason?.message ?? event?.reason ?? '') + '';
    if (msg.includes('securetoken') && (msg.includes('blocked') || msg.includes('granttoken'))) {
      event.preventDefault?.();
      event.stopPropagation?.();
      const { Alert } = require('react-native');
      Alert.alert('Error', getFriendlyAuthErrorMessage(event.reason));
    }
  };
  (g as any).addEventListener('unhandledrejection', handler);
};
setupAuthErrorHandler();

SplashScreen.preventAutoHideAsync();

function ThemeAwareStatusBar() {
  const { isDark, colors } = useThemeColors();

  // Android: set native status bar so time/battery show (StatusBar API + expo-status-bar).
  useLayoutEffect(() => {
    if (Platform.OS !== 'android') return;
    RNStatusBar.setHidden(false);
    RNStatusBar.setTranslucent(false);
    RNStatusBar.setBackgroundColor(colors.background);
    RNStatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true);
  }, [isDark, colors.background]);

  return (
    <StatusBar
      style={isDark ? 'light' : 'dark'}
      hidden={false}
      translucent={false}
      backgroundColor={Platform.OS === 'android' ? colors.background : undefined}
    />
  );
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
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <StatusBar style="light" hidden={false} translucent={false} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AppProviders>
        <Stack
          screenOptions={{
            headerShown: false,
            // freezeOnBlur: pause hidden stack screens (saves work when closing modals)
            freezeOnBlur: true,
          }}>
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
