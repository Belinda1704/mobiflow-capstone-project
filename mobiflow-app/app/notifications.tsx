// Notifications: toggle alert types, see recent. Button to ask permission or open settings.
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNotificationSettings } from '../hooks/useNotificationSettings';
import { requestNotificationPermission } from '../services/goalRemindersService';
import { getRecentNotifications } from '../services/notificationHistoryService';
import type { NotificationHistoryItem, NotificationHistoryType } from '../services/notificationHistoryService';
import { formatRelativeTime } from '../utils/formatDate';
import { FontFamily } from '../constants/colors';
import { PrimaryButton } from '../components/PrimaryButton';

function NotificationIcon({ type, colors, isDark }: { type: NotificationHistoryType; colors: ReturnType<typeof useThemeColors>['colors']; isDark: boolean }) {
  const iconBg = isDark ? colors.surface : colors.primary;
  const iconColor = isDark ? colors.textPrimary : colors.white;
  if (type === 'lowBalance') {
    return (
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name="warning" size={20} color={iconColor} />
      </View>
    );
  }
  if (type === 'budgetOverspent') {
    return (
      <View style={[styles.iconWrap, styles.iconWrapSquare, { backgroundColor: iconBg }]}>
        <Ionicons name="document-text" size={20} color={iconColor} />
      </View>
    );
  }
  if (type === 'goalReminder') {
    return (
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name="flag" size={20} color={iconColor} />
      </View>
    );
  }
  if (type === 'expenseLimit') {
    return (
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name="card-outline" size={20} color={iconColor} />
      </View>
    );
  }
  if (type === 'incomeDrop') {
    return (
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name="trending-down" size={20} color={iconColor} />
      </View>
    );
  }
  return (
    <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
      <Ionicons name="checkmark" size={20} color={iconColor} />
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslations();
  const { colors, isDark } = useThemeColors();
  const { userId } = useCurrentUser();
  const { settings, update } = useNotificationSettings();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recentList, setRecentList] = useState<NotificationHistoryItem[]>([]);

  // Sync with system permission so UI is correct
  const refreshPermissionStatus = useCallback(() => {
    Notifications.getPermissionsAsync().then((result) => {
      setHasPermission(result.status === 'granted');
    });
  }, []);

  useEffect(() => {
    refreshPermissionStatus();
  }, [refreshPermissionStatus]);

  useFocusEffect(
    useCallback(() => {
      refreshPermissionStatus();
    }, [refreshPermissionStatus])
  );

  const loadRecent = useCallback(async () => {
    if (!userId) return;
    const list = await getRecentNotifications(userId);
    setRecentList(list);
  }, [userId]);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  useFocusEffect(
    useCallback(() => {
      loadRecent();
    }, [loadRecent])
  );

  async function handleRequestPermission() {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
  }

  const notificationSettings = settings ?? {
    pushNotifications: true,
    lowBalanceAlerts: true,
    expenseLimitAlerts: true,
    incomeDropAlerts: true,
    budgetAlerts: true,
    transactionAlerts: true,
    goalReminders: true,
    marketing: false,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('notifications')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('notificationSettings').toUpperCase()}</Text>
        
        {hasPermission === false && (
          <View style={[styles.permissionBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.permissionBannerContent}>
              <Ionicons name="notifications-outline" size={28} color={colors.textSecondary} style={styles.permissionBannerIcon} />
              <Text style={[styles.permissionBannerTitle, { color: colors.textPrimary }]}>
                {t('notificationPermissionRequired') || 'Notifications off'}
              </Text>
              <Text style={[styles.permissionBannerSubtitle, { color: colors.textSecondary }]}>
                {t('notificationPermissionDescription') || 'Turn on so the app can send low balance, budget and goal alerts.'}
              </Text>
              <View style={styles.permissionBannerBtn}>
                <PrimaryButton
                  title={t('turnOnNotifications') || 'Turn on notifications'}
                  onPress={handleRequestPermission}
                  variant="yellow"
                />
                <TouchableOpacity style={styles.openSettingsLink} onPress={() => Linking.openSettings()} activeOpacity={0.7}>
                  <Text style={[styles.openSettingsLinkText, { color: colors.listIcon ?? colors.primary }]}>{t('openDeviceSettings')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        {hasPermission === true && (
          <View style={[styles.permissionBanner, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.permissionBannerTitle, { color: colors.textPrimary }]}>
              {t('notificationsEnabled') || 'Notifications enabled'}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.alertLink, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => router.push('/alerts')}
          activeOpacity={0.7}>
          <Text style={[styles.alertLinkText, { color: colors.textPrimary }]}>{t('manageAlertThresholds')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={[styles.settingsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('pushNotifications')}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{t('receiveNotificationsOnDevice')}</Text>
            </View>
            <Switch
              value={notificationSettings.pushNotifications}
              onValueChange={(v) => { void update({ pushNotifications: v }); }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('lowBalanceAlertsSetting')}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{t('getNotifiedWhenBalanceFalls')}</Text>
            </View>
            <Switch
              value={notificationSettings.lowBalanceAlerts}
              onValueChange={(v) => { void update({ lowBalanceAlerts: v }); }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('budgetAlertsSetting')}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{t('alertWhenExceedBudgets')}</Text>
            </View>
            <Switch
              value={notificationSettings.budgetAlerts}
              onValueChange={(v) => { void update({ budgetAlerts: v }); }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('expenseLimitAlertsSetting')}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{t('expenseLimitAlertsSubtitle')}</Text>
            </View>
            <Switch
              value={notificationSettings.expenseLimitAlerts}
              onValueChange={(v) => { void update({ expenseLimitAlerts: v }); }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('incomeDropAlertsSetting')}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{t('incomeDropAlertsSubtitle')}</Text>
            </View>
            <Switch
              value={notificationSettings.incomeDropAlerts}
              onValueChange={(v) => { void update({ incomeDropAlerts: v }); }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('transactionAlertsSetting')}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{t('confirmWhenTransactionsComplete')}</Text>
            </View>
            <Switch
              value={notificationSettings.transactionAlerts}
              onValueChange={(v) => { void update({ transactionAlerts: v }); }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
          <View style={[styles.settingRow, styles.settingRowLast]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{t('goalRemindersSetting')}</Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{t('goalRemindersSettingSubtitle')}</Text>
            </View>
            <Switch
              value={notificationSettings.goalReminders}
              onValueChange={(v) => { void update({ goalReminders: v }); }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary, marginTop: 24 }]}>{t('recentNotificationsSection').toUpperCase()}</Text>
        {recentList.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('noRecentNotifications') || 'No recent notifications'}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {t('noRecentNotificationsSubtitle') || 'Alerts for low balance, budget, and transactions will appear here'}
            </Text>
          </View>
        ) : (
          recentList.map((n) => (
            <View key={n.id} style={[styles.notificationCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <NotificationIcon type={n.type} colors={colors} isDark={isDark} />
              <View style={styles.notificationBody}>
                <Text style={[styles.notificationTitle, { color: colors.textPrimary }]}>{n.title}</Text>
                <Text style={[styles.notificationDetails, { color: colors.textSecondary }]}>{n.details}</Text>
                <Text style={[styles.notificationTimestamp, { color: colors.textSecondary }]}>{formatRelativeTime(n.timestamp)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 1,
    marginBottom: 12,
  },
  permissionBanner: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  permissionBannerContent: {
    width: '100%',
    alignItems: 'center',
  },
  permissionBannerIcon: {
    marginBottom: 10,
  },
  permissionBannerTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    marginBottom: 6,
    textAlign: 'center',
  },
  permissionBannerSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  permissionBannerBtn: {
    marginTop: 18,
    width: '100%',
    maxWidth: 280,
    alignSelf: 'center',
  },
  openSettingsLink: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  openSettingsLinkText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  alertLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  alertLinkText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingText: { flex: 1, marginRight: 12 },
  settingLabel: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  settingSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconWrapSquare: {
    borderRadius: 10,
  },
  notificationBody: { flex: 1 },
  notificationTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  notificationDetails: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  notificationTimestamp: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
});
