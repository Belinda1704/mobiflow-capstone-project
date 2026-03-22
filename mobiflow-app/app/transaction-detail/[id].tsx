// Transaction detail: view one, edit or delete.
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../../components/ScreenHeader';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { updateTransaction, deleteTransaction } from '../../services/transactionsService';
import { removeDisplayLabel } from '../../services/localDisplayLabelsService';
import { removeDisplayNote } from '../../services/localDisplayNotesService';
import { formatRWF, formatRWFWithSign } from '../../utils/formatCurrency';
import { formatTransactionDate } from '../../utils/formatDate';
import { useTranslations } from '../../hooks/useTranslations';
import { translateCategory } from '../../utils/translateCategory';
import { FontFamily } from '../../constants/colors';
import type { Transaction, PaymentMethod } from '../../types/transaction';
import { showError } from '../../services/errorPresenter';
import { computeFraudRiskForTransaction } from '../../utils/fraudModel';
import { getDisplayPhoneFromLabel } from '../../services/customerIdentificationService';

function getPaymentLabel(value: PaymentMethod, t: (k: string) => string): string {
  return value === 'cash' ? t('cash') : t('mobileMoneyMomo');
}

export default function TransactionDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslations();
  const { colors } = useThemeColors();
  const { userId } = useCurrentUser();
  const { transactions, loading: transactionsLoading } = useTransactions(userId ?? null);

  /** After delete the list updates before navigating back; keep last tx in ref so the screen can show Deleted, not empty. */
  const [deletePhase, setDeletePhase] = useState<'none' | 'deleting' | 'done'>('none');
  const latestTxRef = useRef<Transaction | undefined>(undefined);

  const tx = transactions.find((t) => t.id === params.id);

  useEffect(() => {
    if (tx) latestTxRef.current = tx;
  }, [tx]);

  const displayTx = tx ?? (deletePhase !== 'none' ? latestTxRef.current : undefined);

  useEffect(() => {
    if (deletePhase !== 'done') return;
    const timer = setTimeout(() => router.back(), 1000);
    return () => clearTimeout(timer);
  }, [deletePhase, router]);

  if (!params.id) {
    router.back();
    return null;
  }

  // Wait for list — avoid flashing "not found" while Firestore/cache is still loading.
  if (!displayTx && deletePhase === 'none' && transactionsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={t('transactionDetails')} />
        <View style={[styles.centered, { flex: 1 }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingHint, { color: colors.textSecondary }]}>{t('loading')}</Text>
        </View>
      </View>
    );
  }

  if (!displayTx && deletePhase === 'none') {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background, padding: 24 }]}>
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>{t('transactionNotFound')}</Text>
        <TouchableOpacity style={[styles.goBackBtn, { backgroundColor: colors.accent }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={[styles.goBackBtnText, { color: colors.onAccent }]}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!displayTx) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const paymentLabel = getPaymentLabel(displayTx.paymentMethod ?? 'mobile_money', t);
  const reference = `TXN-${displayTx.id.slice(-6).toUpperCase()}`;

  // Balance after this tx (list is newest-first); unavailable once tx drops from list after delete
  const txIndex = transactions.findIndex((t) => t.id === displayTx.id);
  const balanceAfter =
    txIndex >= 0 ? transactions.slice(txIndex).reduce((sum, t) => sum + t.amount, 0) : null;

  function handleDelete() {
    if (!displayTx || deletePhase !== 'none') return;
    const toDelete = displayTx;
    latestTxRef.current = toDelete;
    setDeletePhase('deleting');
    void (async () => {
      try {
        await deleteTransaction(toDelete.id);
        if (userId) {
          await Promise.all([
            removeDisplayLabel(userId, toDelete.id),
            removeDisplayNote(userId, toDelete.id),
          ]);
        }
        setDeletePhase('done');
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : t('couldNotDeleteTransaction');
        showError(t('error'), errorMsg);
        setDeletePhase('none');
      }
    })();
  }

  function handleEdit() {
    if (!displayTx) return;
    router.push({
      pathname: '/edit-transaction/[id]',
      params: { id: displayTx.id },
    } as any);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('transactionDetails')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.typeBadge, { backgroundColor: displayTx.type === 'income' ? colors.success : colors.error }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>{displayTx.type === 'income' ? t('income') : t('expense')}</Text>
          </View>
          <Text style={[styles.amount, { color: displayTx.type === 'income' ? colors.success : colors.error }]}>
            {formatRWFWithSign(displayTx.amount)}
          </Text>
          <Text style={[styles.description, { color: colors.textPrimary }]}>
            {displayTx.displayLabel ?? displayTx.label}
          </Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{formatTransactionDate(displayTx.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{paymentLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('phoneNumber')}</Text>
            <Text
              style={[styles.detailValue, { color: colors.textPrimary }]}>
              {getDisplayPhoneFromLabel(displayTx.displayLabel ?? displayTx.label) || '—'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{displayTx.type === 'income' ? t('from') : t('to')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {displayTx.displayLabel ?? displayTx.label}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('reference')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{reference}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('category')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{translateCategory(displayTx.category, t)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('notes')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {(displayTx.displayNotes ?? displayTx.notes) || '—'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('accountBalanceAfter')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>
              {balanceAfter != null ? formatRWF(balanceAfter) : '—'}
            </Text>
          </View>
          {displayTx.type === 'expense' && (displayTx.paymentMethod === 'cash' || displayTx.paymentMethod === 'mobile_money') && (() => {
            const risk = computeFraudRiskForTransaction(displayTx);
            const pct = Math.round(risk * 100);
            return pct > 0 ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('modelRisk')}</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{pct}%</Text>
              </View>
            ) : null;
          })()}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.deleteBtn,
              {
                borderColor: deletePhase === 'done' ? colors.success : colors.error,
                backgroundColor: deletePhase === 'done' ? colors.success + '18' : 'transparent',
              },
            ]}
            onPress={handleDelete}
            disabled={deletePhase !== 'none'}>
            {deletePhase === 'deleting' ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : deletePhase === 'done' ? (
              <Text style={[styles.deleteBtnText, { color: colors.success }]}>{t('transactionDeleted')}</Text>
            ) : (
              <Text style={[styles.deleteBtnText, { color: colors.error }]}>{t('delete')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.editBtn, { backgroundColor: colors.accent, opacity: deletePhase !== 'none' ? 0.5 : 1 }]}
            onPress={handleEdit}
            disabled={deletePhase !== 'none'}>
            <Text style={[styles.editBtnText, { color: colors.onAccent }]}>{t('edit')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingHint: { marginTop: 12, fontSize: 14, fontFamily: FontFamily.regular },
  notFoundText: { fontSize: 16, fontFamily: FontFamily.regular, textAlign: 'center', marginBottom: 20 },
  goBackBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  goBackBtnText: { fontSize: 16, fontFamily: FontFamily.semiBold },
  scroll: { flex: 1 },
  scrollContent: { padding: 24 },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeIncome: {
    // inline
  },
  badgeExpense: {
    // inline
  },
  badgeText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  amount: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
  },
  amountIncome: { 
    // inline
  },
  amountExpense: { 
    // inline
  },
  description: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  deleteBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
  },
  deleteBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});
