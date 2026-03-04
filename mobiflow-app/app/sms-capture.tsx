// SMS capture screen: toggle, permission, scan past messages
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { useFocusEffect } from '@react-navigation/native';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useSmsCapture } from '../hooks/useSmsCapture';
import { isSmsListenerActive, scanPastSmsMessages, clearPastSmsScannedFlag } from '../services/smsCaptureService';
import { useCallback, useEffect, useState } from 'react';

export default function SmsCaptureScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const { supported, enabled, hasPermissions, loading, toggleEnabled, requestPermissions, refreshPermissions } = useSmsCapture(userId);

  useFocusEffect(
    useCallback(() => {
      refreshPermissions();
    }, [refreshPermissions])
  );
  const [listenerActive, setListenerActive] = useState(false);
  const [scanningPast, setScanningPast] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ processed: number; total: number; added: number } | null>(null);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      setListenerActive(isSmsListenerActive());
    }, 1000);
    return () => clearInterval(checkInterval);
  }, []);

  async function handleToggle(value: boolean) {
    if (!value) setListenerActive(false);
    console.log('[SMS Capture Screen] Toggle changed to:', value);
    await toggleEnabled(value);
    if (value) setTimeout(() => setListenerActive(isSmsListenerActive()), 500);
  }

  async function handleRequestPermission() {
    const granted = await requestPermissions();
    if (granted) {
      await new Promise((r) => setTimeout(r, 300));
      await refreshPermissions();
    }
  }

  async function handleResetAndRescan() {
    if (!userId || !hasPermissions) return;
    await clearPastSmsScannedFlag(userId);
    handleScanPastMessages();
  }

  async function handleScanPastMessages() {
    if (!userId || !hasPermissions) return;
    setScanningPast(true);
    setScanProgress(null);
    try {
      await scanPastSmsMessages(
        userId,
        (processed, total) => setScanProgress((p) => ({ processed, total, added: p?.added ?? 0 })),
        (added) => {
          setScanProgress((p) => (p ? { ...p, added } : { processed: 0, total: 0, added }));
          const msg = added > 0
            ? (t('scanPastCompleteAdded') || 'Added {{count}} transaction(s) from past mobile money messages.').replace('{{count}}', String(added))
            : (t('scanPastCompleteNone') || 'No new mobile money transactions found in past messages.');
          Alert.alert(t('scanPastCompleteTitle') || 'Scan complete', msg);
        },
        (err) => {
          Alert.alert(t('error') || 'Error', err || (t('scanPastError') || 'Failed to scan past messages.'));
        }
      );
    } finally {
      setScanningPast(false);
      setScanProgress(null);
    }
  }

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
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          {t('smsCaptureDescription')}
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary, marginTop: -8 }]}>
          {t('smsCaptureForegroundNote')}
        </Text>

        {/* 1) SMS permission – one grant for both live capture and past scan */}
        {!loading && !hasPermissions && (
          <View style={[styles.section, { borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('smsPermissionRequired') || 'SMS permission'}
            </Text>
            <Text style={[styles.paragraph, { color: colors.textSecondary, marginBottom: 12 }]}>
              {t('smsPermissionDescription') || 'Required for both live capture and scanning past messages.'}
            </Text>
            <View style={[styles.permissionBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
              <Ionicons name="alert-circle" size={24} color={colors.warning} />
              <View style={styles.permissionBannerText}>
                <Text style={[styles.permissionBannerTitle, { color: colors.warningText }]}>
                  {t('smsPermissionRequired') || 'SMS Permission Required'}
                </Text>
                <Text style={[styles.permissionBannerSubtitle, { color: colors.warningText }]}>
                  {t('smsPermissionDescription') || 'Enable SMS permissions to capture mobile money transactions'}
                </Text>
              </View>
              <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleRequestPermission}>
                <Text style={[styles.buttonText, { color: colors.white }]}>{t('smsCaptureGrantPermission') || 'Grant permission'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.openSettingsLink} onPress={() => Linking.openSettings()} activeOpacity={0.7}>
                <Text style={[styles.openSettingsLinkText, { color: colors.listIcon ?? colors.primary }]}>{t('openDeviceSettings')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2) Live capture – only for new incoming SMS; separate from past scan */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('smsCaptureLiveSection') || 'Live capture (new messages)'}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary, marginBottom: 12 }]}>
            {t('smsCaptureLiveDescription') || 'When on, new mobile money SMS are added to transactions as they arrive. Does not scan old messages.'}
          </Text>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('smsCaptureToggle')}</Text>
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              disabled={loading || !hasPermissions}
            />
          </View>
          {hasPermissions && enabled && listenerActive && (
            <View style={[styles.statusRow, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
              <Text style={[styles.statusText, { color: colors.success }]}>
                {t('smsCaptureListeningStatus') || 'Listening for new SMS…'}
              </Text>
            </View>
          )}
        </View>

        {/* 3) Past messages – one-time scan; separate from live listener */}
        <View style={[styles.section, { borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('scanPastMessages') || 'Scan past mobile money messages'}
          </Text>
          <Text style={[styles.paragraph, { color: colors.textSecondary, marginBottom: 12 }]}>
            {t('scanPastDescription') || 'Import transactions from SMS already on your phone. Run once or use reset to scan again.'}
          </Text>
          {!hasPermissions && (
            <Text style={[styles.paragraph, { color: colors.textSecondary, marginBottom: 12 }]}>
              {t('smsPermissionRequired') || 'Grant SMS permission above first.'}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.surfaceElevated }]}
            onPress={handleScanPastMessages}
            disabled={scanningPast || !userId || !hasPermissions}
          >
            {scanningPast ? (
              <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                {scanProgress ? `Scanning ${scanProgress.processed}/${scanProgress.total}…` : 'Scanning…'}
              </Text>
            ) : (
              <Text style={[styles.buttonText, { color: colors.listIcon ?? colors.primary }]}>
                {t('scanPastButton') || 'Scan past messages'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.surface, marginTop: 12, borderWidth: 1, borderColor: colors.border }]}
            onPress={handleResetAndRescan}
            disabled={scanningPast || !userId || !hasPermissions}
          >
            <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
              {t('scanPastResetButton') || 'Reset and rescan past messages'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  paragraph: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
  },
  rowLabel: { fontSize: 16, fontFamily: FontFamily.medium },
  permissionBanner: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  permissionBannerText: {
    flex: 1,
  },
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
  openSettingsLink: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  openSettingsLinkText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  buttonText: { fontSize: 16, fontFamily: FontFamily.medium },
  statusRow: {
    marginTop: 24,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    textAlign: 'center',
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
  },
});
