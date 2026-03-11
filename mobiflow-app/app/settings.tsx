// Settings: account, preferences, SMS, notifications, data, security.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../components/ScreenHeader';
import { useSignOut } from '../hooks/useSignOut';
import { showConfirm } from '../services/errorPresenter';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

const SETTINGS_ITEMS: { labelKey: string; subtitleKey: string; icon: React.ComponentProps<typeof Ionicons>['name']; route?: string; action?: 'resetOnboarding' }[] = [
  { labelKey: 'profile', subtitleKey: 'profileSubtitle', icon: 'person-outline', route: '/profile' },
  { labelKey: 'account', subtitleKey: 'accountSubtitle', icon: 'key-outline', route: '/account' },
  { labelKey: 'notifications', subtitleKey: 'notificationsSubtitle', icon: 'notifications-outline', route: '/notifications' },
  { labelKey: 'smsCapture', subtitleKey: 'smsCaptureSubtitle', icon: 'chatbubble-outline', route: '/sms-capture' },
  { labelKey: 'privacy', subtitleKey: 'privacySubtitle', icon: 'lock-closed-outline', route: '/privacy' },
  { labelKey: 'alerts', subtitleKey: 'alertsSubtitle', icon: 'alert-circle-outline', route: '/alerts' },
  { labelKey: 'dataStorage', subtitleKey: 'dataStorageSubtitle', icon: 'cloud-outline', route: '/data-storage' },
  { labelKey: 'helpSupport', subtitleKey: 'helpSupportSubtitle', icon: 'help-circle-outline', route: '/help-support' },
  { labelKey: 'about', subtitleKey: 'aboutSubtitle', icon: 'information-circle-outline', route: '/about' },
  { labelKey: 'resetOnboarding', subtitleKey: 'resetOnboardingSubtitle', icon: 'refresh-outline', action: 'resetOnboarding' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signOut } = useSignOut();
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  function handleResetOnboarding() {
    showConfirm(
      t('resetConfirmTitle'),
      t('resetConfirmMessage'),
      async () => {
        await AsyncStorage.removeItem('hasCompletedOnboarding');
        await AsyncStorage.removeItem('hasSeenPermissions');
        await AsyncStorage.removeItem('@mobiflow/showPermissionsOnDashboard');
        const ok = await signOut();
        if (ok) router.replace('/');
      },
      { confirmText: t('reset') }
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('settings')} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}>
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.labelKey}
            style={[styles.row, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => {
              if (item.action === 'resetOnboarding') handleResetOnboarding();
              else if (item.route) router.push(item.route as any);
            }}>
            <View style={[styles.iconWrap, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name={item.icon} size={22} color={colors.textPrimary} />
            </View>
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t(item.labelKey)}</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{t(item.subtitleKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16, fontFamily: FontFamily.medium },
  rowSubtitle: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 2 },
});
