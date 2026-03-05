// SMS capture screen: user can turn on SMS access, enable live capture, and scan past MoMo/Airtel messages
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSmsCapture } from '../hooks/useSmsCapture';
import {
  isSmsListenerActive,
  scanPastSmsMessages,
  clearPastSmsScannedFlag,
} from '../services/smsCaptureService';

export default function SmsCaptureScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const {
    supported,
    enabled,
    hasPermissions,
    loading,
    toggleEnabled,
    requestPermissions,
    refreshPermissions,
  } = useSmsCapture(userId);

  const [listenerActive, setListenerActive] = useState(false);
  const [scanningPast, setScanningPast] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ processed: number; total: number; added: number } | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      refreshPermissions();
    }, [refreshPermissions]),
  );

  useEffect(() => {
    const id = setInterval(() => {
      setListenerActive(isSmsListenerActive());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const handleToggle = useCallback(
    async (value: boolean) => {
      if (!value) {
        setListenerActive(false);
      }
      await toggleEnabled(value);
      if (value) {
        setTimeout(() => setListenerActive(isSmsListenerActive()), 500);
      }
    },
    [toggleEnabled],
  );

  const handleSmsPermissionToggle = useCallback(
    async (value: boolean) => {
      if (!value) {
        return;
      }
      const granted = await requestPermissions();
      if (granted) {
        await new Promise((r) => setTimeout(r, 300));
        await refreshPermissions();
      }
    },
    [refreshPermissions, requestPermissions],
  );

  // Scan existing SMS on the device once; shows progress and result alert
  const handleScanPastMessages = useCallback(async () => {
    if (!userId || !hasPermissions) return;
    setScanningPast(true);
    setScanProgress(null);
    try {
      await scanPastSmsMessages(
        userId,
        (processed, total) => setScanProgress((p) => ({ processed, total, added: p?.added ?? 0 })),
        (added) => {
          setScanProgress((p) => (p ? { ...p, added } : { processed: 0, total: 0, added }));
          const msg =
            added > 0
              ? (t('scanPastCompleteAdded') ||
                  'Added {{count}} transaction(s) from past mobile money messages.').replace(
                  '{{count}}',
                  String(added),
                )
              : t('scanPastCompleteNone') || 'No new mobile money transactions found in past messages.';
          Alert.alert(t('scanPastCompleteTitle') || 'Scan complete', msg);
        },
        (err) => {
          Alert.alert(t('error') || 'Error', err || t('scanPastError') || 'Failed to scan past messages.');
        },
      );
    } finally {
      setScanningPast(false);
      setScanProgress(null);
    }
  }, [hasPermissions, t, userId]);

  // Clear the "already scanned" flag then run scan again (for re-importing after new messages)
  const handleResetAndRescan = useCallback(async () => {
    if (!userId || !hasPermissions) return;
    await clearPastSmsScannedFlag(userId);
    await handleScanPastMessages();
  }, [handleScanPastMessages, hasPermissions, userId]);

  if (!supported) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
        <ScreenHeader title={t('smsCapture')} subtitle={t('smsCaptureSubtitle')} />
        <ScrollView style={styles.content} contentContainerStyle={styles.padding}>
          <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
            {t('smsCaptureAndroidOnly')}
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('smsCapture')} subtitle={t('smsCaptureSubtitle')} />
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.padding, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Intro explanation – no icon, text only */}
        <View style={[styles.introCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>{t('smsCaptureDescription')}</Text>
          <Text style={[styles.introNote, { color: colors.textSecondary }]}>{t('smsCaptureForegroundNote')}</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
          {t('smsPermissionSettings') || 'SMS SETTINGS'}
        </Text>

        {/* SMS access – permission toggle */}
        <View style={[styles.settingsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                {t('smsAccessLabel') || 'SMS access'}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                {t('smsAccessSubtitle') || 'Read & receive SMS for MTN MoMo and Airtel Money'}
              </Text>
            </View>
            <Switch
              value={hasPermissions}
              onValueChange={handleSmsPermissionToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
              disabled={loading}
            />
          </View>
          {!hasPermissions && (
            <TouchableOpacity
              style={styles.cardLink}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.7}
            >
              <Text style={[styles.cardLinkText, { color: colors.listIcon ?? colors.primary }]}>
                {t('openDeviceSettings')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Live capture – new SMS only */}
        <View style={[styles.settingsCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                {t('smsCaptureToggle') || 'Capture new SMS automatically'}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                {t('smsCaptureLiveDescription') || 'Add new mobile money SMS as they arrive'}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.white}
              disabled={loading || !hasPermissions}
            />
          </View>
        </View>

        {hasPermissions && enabled && listenerActive && (
          <View style={[styles.listeningPill, { backgroundColor: colors.success + '18' }]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={[styles.listeningPillText, { color: colors.success }]}>
              {t('smsCaptureListeningStatus') || 'Listening for new SMS…'}
            </Text>
          </View>
        )}

        {/* Scan past SMS – compact button + reset link */}
        <View style={[styles.scanCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.scanCardTitle, { color: colors.textPrimary }]}>
            {t('scanPastMessages') || 'Scan past mobile money messages'}
          </Text>
          <Text style={[styles.scanCardDescription, { color: colors.textSecondary }]}>
            {t('scanPastDescription') ||
              'Import from messages already on your phone. Run once or use reset to scan again.'}
          </Text>
          <View style={styles.scanActions}>
            <TouchableOpacity
              style={[styles.scanButton, { backgroundColor: colors.accent }]}
              onPress={handleScanPastMessages}
              disabled={scanningPast || !userId || !hasPermissions}
              activeOpacity={0.8}
            >
              <Text style={[styles.scanButtonText, { color: colors.primary }]}>
                {scanningPast && scanProgress
                  ? `${t('scanning') || 'Scanning'} ${scanProgress?.processed ?? 0}/${scanProgress?.total ?? 0}…`
                  : t('scanPastButton') || 'Scan past messages'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.resetLink}
              onPress={handleResetAndRescan}
              disabled={scanningPast || !userId || !hasPermissions}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetLinkText, { color: colors.textSecondary }]}>
                {t('scanPastResetButton') || 'Reset and rescan past messages'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 20, paddingBottom: 40 },
  introCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
  },
  introText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 21,
    marginBottom: 6,
  },
  introNote: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
    opacity: 0.9,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
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
  listeningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 16,
    gap: 6,
  },
  listeningPillText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  textLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  textLinkLabel: { fontSize: 14, fontFamily: FontFamily.medium },
  cardLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cardLinkText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  scanCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  scanCardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  scanCardDescription: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 19,
  },
  scanActions: {
    marginTop: 16,
    gap: 12,
  },
  scanButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  resetLink: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  resetLinkText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  permissionBanner: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  permissionBannerText: { flex: 1 },
  permissionBannerTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  permissionBannerSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
  },
  button: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  openSettingsLink: { marginTop: 12, paddingVertical: 8, alignItems: 'center' },
  openSettingsLinkText: { fontSize: 14, fontFamily: FontFamily.medium },
  buttonText: { fontSize: 16, fontFamily: FontFamily.medium },
});
