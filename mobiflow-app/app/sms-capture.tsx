// SMS capture: auto-capture toggle, permission, scan past.
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

  // Sync with system permission
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
    console.log('[SMS Capture Screen] Toggle changed to:', value);
    await toggleEnabled(value);
    setTimeout(() => setListenerActive(isSmsListenerActive()), 500);
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

        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{t('smsCaptureToggle')}</Text>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.white}
            disabled={loading}
          />
        </View>

        {!loading && !hasPermissions && (
          <View style={[styles.permissionBanner, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
            <Ionicons name="alert-circle" size={24} color={colors.warning} />
            <View style={styles.permissionBannerText}>
              <Text style={[styles.permissionBannerTitle, { color: colors.warningText }]}>
                {t('smsPermissionRequired') || 'SMS Permission Required'}
              </Text>
              <Text style={[styles.permissionBannerSubtitle, { color: colors.warningText }]}>
                {t('smsPermissionDescription') || 'Enable SMS permissions to automatically capture mobile money transactions'}
              </Text>
            </View>
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleRequestPermission}>
              <Text style={[styles.buttonText, { color: colors.white }]}>{t('smsCaptureGrantPermission') || 'Grant Permission'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.openSettingsLink} onPress={() => Linking.openSettings()} activeOpacity={0.7}>
              <Text style={[styles.openSettingsLinkText, { color: colors.listIcon ?? colors.primary }]}>{t('openDeviceSettings')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasPermissions && enabled && listenerActive && (
          <View style={[styles.statusRow, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
            <Text style={[styles.statusText, { color: colors.success }]}>
              ✓ Listening for SMS...
            </Text>
          </View>
        )}

        {/* Past message scan. "Reset and rescan" clears the flag so a full past scan runs again. */}
        {hasPermissions && userId && (
          <>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.surfaceElevated, marginTop: 24 }]}
              onPress={handleScanPastMessages}
              disabled={scanningPast}
            >
              {scanningPast ? (
                <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                  {scanProgress ? `Scanning ${scanProgress.processed}/${scanProgress.total}...` : 'Scanning...'}
                </Text>
              ) : (
                <Text style={[styles.buttonText, { color: colors.listIcon ?? colors.primary }]}>
                  {t('scanPastMessages') || 'Scan past mobile money messages'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.surface, marginTop: 12, borderWidth: 1, borderColor: colors.border }]}
              onPress={handleResetAndRescan}
              disabled={scanningPast}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>
                Reset and rescan past messages
              </Text>
            </TouchableOpacity>
          </>
        )}
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
});
