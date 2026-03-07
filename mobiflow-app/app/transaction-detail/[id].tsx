// Transaction detail: view one, edit or delete.
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../../components/ScreenHeader';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { updateTransaction, deleteTransaction } from '../../services/transactionsService';
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
  const { transactions } = useTransactions(userId!);

  const [deleting, setDeleting] = useState(false);

  const tx = transactions.find((t) => t.id === params.id);

  if (!params.id) {
    router.back();
    return null;
  }

  if (!tx) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.surfaceElevated, padding: 24 }]}>
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>{t('transactionNotFound')}</Text>
        <TouchableOpacity style={[styles.goBackBtn, { backgroundColor: colors.accent }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={[styles.goBackBtnText, { color: colors.black }]}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const absAmount = Math.abs(tx.amount);
  const paymentLabel = getPaymentLabel(tx.paymentMethod ?? 'mobile_money', t);
  const reference = `TXN-${tx.id.slice(-6).toUpperCase()}`;

  // Balance after this tx (list is newest-first)
  const txIndex = transactions.findIndex((t) => t.id === tx.id);
  const fromThisTxToOldest = transactions.slice(txIndex);
  const balanceAfter = fromThisTxToOldest.reduce((sum, t) => sum + t.amount, 0);

  function handleDelete() {
    if (!tx) return;
    Alert.alert(
      t('deleteTransaction'),
      t('deleteTransactionConfirm', { label: tx.label }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            if (!tx) return;
            setDeleting(true);
            try {
              await deleteTransaction(tx.id);
              Alert.alert(
                t('transactionDeleted'),
                t('transactionDeletedMessage'),
                [{ text: t('ok'), onPress: () => router.back() }]
              );
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : t('couldNotDeleteTransaction');
              showError(t('error'), errorMsg);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  function handleEdit() {
    if (!tx) return;
    router.push({
      pathname: '/edit-transaction/[id]',
      params: { id: tx.id },
    } as any);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('transactionDetails')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.typeBadge, { backgroundColor: tx.type === 'income' ? colors.success : colors.error }]}>
            <Text style={[styles.badgeText, { color: colors.white }]}>{tx.type === 'income' ? t('income') : t('expense')}</Text>
          </View>
          <Text style={[styles.amount, { color: tx.type === 'income' ? colors.success : colors.error }]}>
            {formatRWFWithSign(tx.amount)}
          </Text>
          <Text style={[styles.description, { color: colors.textPrimary }]}>{tx.label}</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{formatTransactionDate(tx.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>{paymentLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('phoneNumber')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{getDisplayPhoneFromLabel(tx.label) || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{tx.type === 'income' ? t('from') : t('to')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{tx.label}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('reference')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{reference}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('category')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{translateCategory(tx.category, t)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('notes')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{tx.notes || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('accountBalanceAfter')}</Text>
            <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{formatRWF(balanceAfter)}</Text>
          </View>
          {tx.type === 'expense' && (tx.paymentMethod === 'cash' || tx.paymentMethod === 'mobile_money') && (() => {
            const risk = computeFraudRiskForTransaction(tx);
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
            style={[styles.deleteBtn, { borderColor: colors.error }]}
            onPress={handleDelete}
            disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={[styles.deleteBtnText, { color: colors.error }]}>{t('delete')}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.editBtn, { backgroundColor: colors.accent }]} 
            onPress={handleEdit}
            disabled={deleting}>
            <Text style={[styles.editBtnText, { color: colors.black }]}>{t('edit')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
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
