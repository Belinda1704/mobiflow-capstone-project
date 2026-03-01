// Data & storage: export/import, cloud backup, restore, delete all.
import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import { ScreenHeader } from '../components/ScreenHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactions } from '../hooks/useTransactions';
import { useAddTransaction } from '../hooks/useAddTransaction';
import { FontFamily } from '../constants/colors';
import { showError } from '../services/errorPresenter';
import {
  buildBackupData,
  parseBackupJson,
  backupToTransactionInputs,
} from '../services/backupRestoreService';
import {
  uploadBackupToCloud,
  listCloudBackups,
  downloadBackupFromCloud,
  type CloudBackupItem,
} from '../services/cloudBackupService';
import {
  getDisplayName,
  getBusinessName,
  getBusinessType,
  setDisplayName,
  setBusinessName,
  setBusinessType,
} from '../services/preferencesService';
import { deleteAllTransactionsForUser } from '../services/transactionsService';
import { clearPastSmsScannedFlag } from '../services/smsCaptureService';

export default function DataStorageScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const { transactions } = useTransactions(userId ?? '');
  const { addTransaction } = useAddTransaction(userId ?? '');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backingUpToCloud, setBackingUpToCloud] = useState(false);
  const [restoringFromCloud, setRestoringFromCloud] = useState(false);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupItem[] | null>(null);
  const [cloudBackupCount, setCloudBackupCount] = useState<number | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    if (!userId) return;
    listCloudBackups(userId).then((list) => setCloudBackupCount(list.length)).catch(() => setCloudBackupCount(0));
  }, [userId]);

  async function handleExport() {
    if (!userId) return;
    setExporting(true);
    try {
      const [displayName, businessName, businessType] = await Promise.all([
        getDisplayName(),
        getBusinessName(),
        getBusinessType(),
      ]);
      const backup = buildBackupData(transactions, {
        displayName,
        businessName,
        businessType,
      });
      const json = JSON.stringify(backup, null, 2);
      const filename = `mobiflow-backup-${new Date().toISOString().slice(0, 10)}.json`;
      // Fallback if cache dir missing
      const cacheDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
      const uri = cacheDir ? `${cacheDir}${filename}` : filename;
      await FileSystem.writeAsStringAsync(uri, json, {
        encoding: 'utf8' as any,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/json',
          dialogTitle: t('exportData'),
        });
      } else {
        Alert.alert(t('exportData'), `Backup saved: ${uri}`);
      }
    } catch (err) {
      showError(t('error'), err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  async function handleImport() {
    if (!userId) return;
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/json'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        setImporting(false);
        return;
      }
      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const parsed = parseBackupJson(content);
      if (!parsed.ok) {
        showError(t('error'), parsed.error);
        setImporting(false);
        return;
      }
      const inputs = backupToTransactionInputs(parsed.data);
      let added = 0;
      for (const tx of inputs) {
        await addTransaction(tx);
        added++;
      }
      if (parsed.data.settings) {
        const s = parsed.data.settings;
        if (s.displayName != null) await setDisplayName(s.displayName);
        if (s.businessName != null) await setBusinessName(s.businessName);
        if (s.businessType != null && ['retail', 'services', 'agriculture', 'other'].includes(s.businessType)) {
          await setBusinessType(s.businessType as 'retail' | 'services' | 'agriculture' | 'other');
        }
      }
      Alert.alert(
        t('importComplete'),
        t('importCompleteMessage', { count: added })
      );
    } catch (err) {
      showError(t('error'), err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  const applyBackupContent = useCallback(
    async (content: string) => {
      if (!userId) return 0;
      const parsed = parseBackupJson(content);
      if (!parsed.ok) {
        showError(t('error'), parsed.error);
        return 0;
      }
      const inputs = backupToTransactionInputs(parsed.data);
      let added = 0;
      for (const tx of inputs) {
        await addTransaction(tx);
        added++;
      }
      if (parsed.data.settings) {
        const s = parsed.data.settings;
        if (s.displayName != null) await setDisplayName(s.displayName);
        if (s.businessName != null) await setBusinessName(s.businessName);
        if (s.businessType != null && ['retail', 'services', 'agriculture', 'other'].includes(s.businessType)) {
          await setBusinessType(s.businessType as 'retail' | 'services' | 'agriculture' | 'other');
        }
      }
      return added;
    },
    [userId, addTransaction, t]
  );

  async function handleBackupToCloud() {
    if (!userId) return;
    setBackingUpToCloud(true);
    try {
      const [displayName, businessName, businessType] = await Promise.all([
        getDisplayName(),
        getBusinessName(),
        getBusinessType(),
      ]);
      const backup = buildBackupData(transactions, {
        displayName,
        businessName,
        businessType,
      });
      const json = JSON.stringify(backup, null, 2);
      await uploadBackupToCloud(userId, json);
      const list = await listCloudBackups(userId);
      setCloudBackupCount(list.length);
      Alert.alert(t('backupToCloudSuccess'), '');
    } catch (err) {
      showError(t('error'), t('cloudBackupFailed'));
    } finally {
      setBackingUpToCloud(false);
    }
  }

  async function loadCloudBackups() {
    if (!userId) return;
    setCloudBackups(null);
    try {
      const list = await listCloudBackups(userId);
      setCloudBackups(list);
    } catch {
      setCloudBackups([]);
      showError(t('error'), t('cloudBackupFailed'));
    }
  }

  async function handleRestoreFromCloud(item: CloudBackupItem) {
    if (!userId) return;
    setRestoringFromCloud(true);
    try {
      const content = await downloadBackupFromCloud(item.fullPath);
      const added = await applyBackupContent(content);
      Alert.alert(t('importComplete'), t('importCompleteMessage', { count: added }));
      setCloudBackups(null);
    } catch {
      showError(t('error'), t('restoreFromCloudFailed'));
    } finally {
      setRestoringFromCloud(false);
    }
  }

  async function handleDeleteAllTransactions() {
    if (!userId) return;
    Alert.alert(
      t('deleteAllTransactions'),
      t('deleteAllTransactionsConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            setDeletingAll(true);
            try {
              const count = await deleteAllTransactionsForUser(userId, (deleted, total) => {
                if (total > 0 && deleted === total) {
                  // done
                }
              });
              await clearPastSmsScannedFlag(userId);
              Alert.alert(t('done'), t('deleteAllTransactionsDone', { count }));
            } catch (err) {
              showError(t('error'), err instanceof Error ? err.message : 'Could not delete transactions.');
            } finally {
              setDeletingAll(false);
            }
          },
        },
      ]
    );
  }

  const backupCount = cloudBackups !== null ? cloudBackups.length : cloudBackupCount;
  const total = transactions.length + (backupCount ?? 0) * 10 || 1;
  const transactionsShare = transactions.length / total;
  const backupsShare = ((backupCount ?? 0) * 10) / total;
  const ringSize = 120;
  const ringStroke = 10;
  const r = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * r;
  const seg1 = circumference * transactionsShare;
  const seg2 = circumference * backupsShare;
  const ringCenter = ringSize / 2;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('dataStorage')} subtitle={t('dataStorageSubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <View style={[styles.ringCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.ringWrap}>
            <Svg width={ringSize} height={ringSize} style={styles.ringSvg}>
              <Circle
                cx={ringCenter}
                cy={ringCenter}
                r={r}
                stroke={colors.border}
                strokeWidth={ringStroke}
                fill="none"
                transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
              />
              {transactionsShare > 0 && (
                <Circle
                  cx={ringCenter}
                  cy={ringCenter}
                  r={r}
                  stroke={colors.primary}
                  strokeWidth={ringStroke}
                  fill="none"
                  strokeDasharray={`${seg1} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                />
              )}
              {backupsShare > 0 && (
                <Circle
                  cx={ringCenter}
                  cy={ringCenter}
                  r={r}
                  stroke={colors.accent}
                  strokeWidth={ringStroke}
                  fill="none"
                  strokeDasharray={`${seg2} ${circumference}`}
                  strokeDashoffset={-seg1}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${ringCenter} ${ringCenter})`}
                />
              )}
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={[styles.ringCenterValue, { color: colors.textPrimary }]}>{transactions.length}</Text>
              <Text style={[styles.ringCenterLabel, { color: colors.textSecondary }]}>{t('transactions')}</Text>
            </View>
          </View>
        </View>

        <View style={styles.categoryRow}>
          <View style={[styles.categoryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            <Text style={[styles.categoryValue, { color: colors.textPrimary }]}>{transactions.length}</Text>
            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>{t('transactions')}</Text>
          </View>
          <View style={[styles.categoryCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="cloud-outline" size={24} color={colors.primary} />
            <Text style={[styles.categoryValue, { color: colors.textPrimary }]}>{backupCount === null ? '—' : backupCount}</Text>
            <Text style={[styles.categoryLabel, { color: colors.textSecondary }]}>{t('cloudBackups')}</Text>
          </View>
        </View>

        <View style={styles.primaryCtaWrap}>
          <PrimaryButton
            title={backingUpToCloud ? t('exporting') : t('backupToCloud')}
            onPress={handleBackupToCloud}
            disabled={backingUpToCloud}
          />
        </View>

        <Text style={[styles.introLine, { color: colors.textSecondary }]}>{t('dataStorageDescription')}</Text>

        <View style={[styles.listCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity style={[styles.listRow, { borderBottomColor: colors.border }]} onPress={handleExport} disabled={exporting}>
            <View style={[styles.listIconWrap, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="download-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.listRowText}>
              <Text style={[styles.listRowTitle, { color: colors.textPrimary }]}>{t('exportData')}</Text>
              <Text style={[styles.listRowSubtitle, { color: colors.textSecondary }]}>Export JSON backup file</Text>
            </View>
            {exporting ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.listRow, { borderBottomColor: colors.border }]} onPress={handleImport} disabled={importing}>
            <View style={[styles.listIconWrap, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="document-attach-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.listRowText}>
              <Text style={[styles.listRowTitle, { color: colors.textPrimary }]}>{t('importData')}</Text>
              <Text style={[styles.listRowSubtitle, { color: colors.textSecondary }]}>Restore from JSON file</Text>
            </View>
            {importing ? <ActivityIndicator size="small" color={colors.primary} /> : <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.listRow, { borderBottomColor: colors.border }]}
            onPress={cloudBackups === null ? loadCloudBackups : undefined}
            disabled={cloudBackups !== null && cloudBackups.length === 0}>
            <View style={[styles.listIconWrap, { backgroundColor: colors.surfaceElevated }]}>
              <Ionicons name="cloud-download-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.listRowText}>
              <Text style={[styles.listRowTitle, { color: colors.textPrimary }]}>{t('restoreFromCloud')}</Text>
              <Text style={[styles.listRowSubtitle, { color: colors.textSecondary }]}>
                {cloudBackups === null ? t('showCloudBackups') : cloudBackups.length === 0 ? t('noCloudBackups') : t('restoreFromCloudDescription')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          {cloudBackups != null && cloudBackups.length > 0 && (
            <View style={styles.backupListInCard}>
              {cloudBackups.map((item) => (
                <TouchableOpacity
                  key={item.fullPath}
                  style={[styles.backupItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={() => handleRestoreFromCloud(item)}
                  disabled={restoringFromCloud}>
                  {restoringFromCloud ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={[styles.backupItemText, { color: colors.textPrimary }]} numberOfLines={1}>{item.name}</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity style={[styles.listRow, styles.listRowLast]} onPress={handleDeleteAllTransactions} disabled={deletingAll}>
            <View style={[styles.listIconWrap, { backgroundColor: (colors.error as string) + '18' }]}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </View>
            <View style={styles.listRowText}>
              <Text style={[styles.listRowTitle, { color: colors.textPrimary }]}>{t('reset')}</Text>
              <Text style={[styles.listRowSubtitle, { color: colors.textSecondary }]}>{t('deleteAllTransactionsSubtitle')}</Text>
            </View>
            {deletingAll ? <ActivityIndicator size="small" color={colors.error} /> : <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>

        <View style={[styles.tipCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.tipIconWrap, { backgroundColor: colors.surfaceElevated }]}>
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
          </View>
          <View style={styles.tipTextWrap}>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>{t('dataSafetyTipTitle')}</Text>
            <Text style={[styles.tipSubtitle, { color: colors.textSecondary }]}>{t('dataSafetyTipBody')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  ringCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  ringWrap: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: { position: 'absolute' },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterValue: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
  },
  ringCenterLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  categoryCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  categoryValue: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
  },
  categoryLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  primaryCtaWrap: { marginBottom: 16 },
  introLine: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 21,
    marginBottom: 20,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  listRowLast: { borderBottomWidth: 0 },
  listIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listRowText: { flex: 1, minWidth: 0 },
  listRowTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  listRowSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  backupListInCard: {
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  backupItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  backupItemText: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
  },
  tipIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTextWrap: { flex: 1 },
  tipTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  tipSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
    lineHeight: 19,
  },
});
