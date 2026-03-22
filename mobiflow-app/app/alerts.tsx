// Alerts: set low balance and expense limits, see when they’re crossed.
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { SettingsRow } from '../components/SettingsRow';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAlerts } from '../hooks/useAlerts';
import { useTransactions } from '../hooks/useTransactions';
import { useAlertsCheck } from '../hooks/useAlertsCheck';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { formatRWF } from '../utils/formatCurrency';
import { showError } from '../services/errorPresenter';

export default function AlertsScreen() {
  const { t } = useTranslations();
  const { colors } = useThemeColors();
  const { userId } = useCurrentUser();
  const { settings, loading, update } = useAlerts(userId);
  const { transactions } = useTransactions(userId || null);
  const { incomeDrop, budgetBreaches } = useAlertsCheck(userId, transactions);
  const [lowBalance, setLowBalance] = useState('');
  const [expenseLimit, setExpenseLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Defaults until loaded
  const alertSettings = settings || {
    lowBalanceThreshold: 50000,
    expenseLimitMonthly: 100000,
    incomeDropPercent: 20,
    enableLowBalance: true,
    enableHighSpending: true,
    enableIncomeDrop: true,
    enableAnomaly: true,
  };

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const lb = lowBalance.trim() ? parseInt(lowBalance.replace(/\D/g, ''), 10) : undefined;
      const el = expenseLimit.trim() ? parseInt(expenseLimit.replace(/\D/g, ''), 10) : undefined;
      if (lb !== undefined && (isNaN(lb) || lb < 0)) {
        showError(t('error'), t('enterValidLowBalance'));
        setSaving(false);
        return;
      }
      if (el !== undefined && (isNaN(el) || el < 0)) {
        showError(t('error'), t('enterValidExpenseLimit'));
        setSaving(false);
        return;
      }
      await update({
        lowBalanceThreshold: lb ?? alertSettings.lowBalanceThreshold,
        expenseLimitMonthly: el ?? alertSettings.expenseLimitMonthly,
      });
      setLowBalance('');
      setExpenseLimit('');
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch {
      setSaving(false);
    }
  }

  // Data from cache
  const hasActiveAlerts = incomeDrop || budgetBreaches.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('alerts')} subtitle={t('alertsSubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        {hasActiveAlerts && (
          <View style={[styles.activeAlertsCard, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
            <Text style={[styles.activeAlertsTitle, { color: colors.warningText }]}>{t('activeAlerts')}</Text>
            {incomeDrop && (
              <Text style={[styles.activeAlertsItem, { color: colors.warningText }]}>
                {t('incomeDropAlert', { percent: Math.min(incomeDrop.percentDrop, 99) })}
              </Text>
            )}
            {budgetBreaches.map((b) => (
              <Text key={b.category} style={[styles.activeAlertsItem, { color: colors.warningText }]}>
                {t('budgetBreachAlert', { category: b.category, percent: b.percentOver })}
              </Text>
            ))}
          </View>
        )}
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('lowBalanceAlertTitle')}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{t('notifyWhenBalanceFallsBelow')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
            placeholder={t('currentPlaceholder', { value: formatRWF(alertSettings.lowBalanceThreshold) })}
            placeholderTextColor={colors.textSecondary}
            value={lowBalance}
            onChangeText={setLowBalance}
            keyboardType="numeric"
          />
        </View>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t('monthlyExpenseLimit')}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{t('alertWhenExpensesExceed')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
            placeholder={t('currentPlaceholder', { value: formatRWF(alertSettings.expenseLimitMonthly) })}
            placeholderTextColor={colors.textSecondary}
            value={expenseLimit}
            onChangeText={setExpenseLimit}
            keyboardType="numeric"
          />
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>
            {saved ? t('saved') : saving ? t('saving') : t('save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  activeAlertsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  activeAlertsTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    marginBottom: 8,
  },
  activeAlertsItem: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontFamily: FontFamily.semiBold },
  cardSubtitle: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 4, marginBottom: 12 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontFamily: FontFamily.semiBold },
});
