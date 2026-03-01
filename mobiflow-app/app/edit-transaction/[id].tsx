// Edit transaction: form pre-filled, save changes.
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCategories } from '../../hooks/useCategories';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { updateTransaction } from '../../services/transactionsService';
import { saveCategoryCorrection } from '../../services/categorizationService';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useTranslations } from '../../hooks/useTranslations';
import { translateCategory } from '../../utils/translateCategory';
import { FontFamily } from '../../constants/colors';
import type { PaymentMethod } from '../../types/transaction';
import { showError } from '../../services/errorPresenter';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money (MTN MoMo)' },
];

export default function EditTransactionScreen() {
  const router = useRouter();
  const { t } = useTranslations();
  const { colors } = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string }>();
  const { userId } = useCurrentUser();
  const { transactions } = useTransactions(userId!);
  const { categories, addCategory } = useCategories(userId!, 'open');

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('Other');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const tx = transactions.find((t) => t.id === params.id);

  useEffect(() => {
    if (tx) {
      setLabel(tx.label);
      setAmount(String(Math.abs(tx.amount)));
      setType(tx.type);
      setCategory(tx.category);
      setPaymentMethod(tx.paymentMethod ?? 'mobile_money');
      setNotes(tx.notes ?? '');
    }
  }, [tx]);

  async function handleSave() {
    if (!params.id || !label.trim()) {
      showError(t('error'), t('pleaseEnterDescription'));
      return false;
    }
    const amt = parseInt(amount, 10);
    if (isNaN(amt) || amt <= 0) {
      showError(t('error'), t('pleaseEnterValidAmount'));
      return false;
    }
    if (!tx) {
      showError(t('error'), t('transactionNotFound') || 'Transaction not found');
      return false;
    }
    setLoading(true);
    try {
      await updateTransaction(params.id, {
        label: label.trim(),
        amount: amt,
        type,
        category,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      if (userId && category !== tx.category && label.trim()) {
        await saveCategoryCorrection(userId, label.trim(), category);
      }
      router.back();
    } catch {
      showError(t('error'), t('couldNotUpdateTransaction'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const added = await addCategory(name);
    if (added) {
      setCategory(added.name);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  }

  if (!params.id) {
    router.back();
    return null;
  }

  // Not found = empty state
  if (!tx) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 16 }}>{t('transactionNotFound') || 'Transaction not found'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surfaceElevated }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('editTransaction')}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.amountSection, { backgroundColor: colors.background }]}>
          <Text style={[styles.amountLabel, { color: colors.textSecondary }]}>{t('amount')}</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.textPrimary }]}
            placeholder={t('amountPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
          />
          <Text style={[styles.currency, { color: colors.textSecondary }]}>RWF</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('description')}</Text>
          <TextInput
            style={[styles.notesInput, { color: colors.textPrimary, minHeight: undefined }]}
            placeholder={t('descriptionPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={label}
            onChangeText={setLabel}
          />
        </View>

        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              { backgroundColor: colors.background },
              type === 'income' && { backgroundColor: colors.success + '26', borderWidth: 2, borderColor: colors.success },
            ]}
            onPress={() => setType('income')}>
            <Text style={[styles.typeText, { color: type === 'income' ? colors.success : colors.textSecondary }]}>{t('income')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              { backgroundColor: colors.background },
              type === 'expense' && { backgroundColor: colors.error + '26', borderWidth: 2, borderColor: colors.error },
            ]}
            onPress={() => setType('expense')}>
            <Text style={[styles.typeText, { color: type === 'expense' ? colors.error : colors.textSecondary }]}>{t('expense')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('category')}</Text>
          <View style={styles.categoryChips}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id ?? c.name}
                style={[styles.chip, { backgroundColor: colors.surfaceElevated }, category === c.name && [styles.chipActive, { backgroundColor: colors.accent }]]}
                onPress={() => setCategory(c.name)}>
                <Text style={[styles.chipText, { color: colors.textSecondary }, category === c.name && [styles.chipTextActive, { color: colors.black }]]}>{translateCategory(c.name, t)}</Text>
              </TouchableOpacity>
            ))}
            {showAddCategory ? (
              <View style={styles.addCategoryRow}>
                <TextInput
                  style={[styles.addCategoryInput, { backgroundColor: colors.surfaceElevated, color: colors.textPrimary }]}
                  placeholder={t('newCategory')}
                  placeholderTextColor={colors.textSecondary}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                />
                <TouchableOpacity style={[styles.addCategoryBtn, { backgroundColor: colors.accent }]} onPress={handleAddCategory}>
                  <Text style={[styles.addCategoryBtnText, { color: colors.black }]}>{t('add')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={[styles.addChip, { borderColor: colors.border }]} onPress={() => setShowAddCategory(true)}>
                <Ionicons name="add" size={18} color={colors.primary} />
                <Text style={[styles.addChipText, { color: colors.textPrimary }]}>{t('addCategory')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('paymentMethod')}</Text>
          <View style={styles.paymentChips}>
            {PAYMENT_METHODS.map((pm) => (
              <TouchableOpacity
                key={pm.value}
                style={[styles.chip, { backgroundColor: colors.surfaceElevated }, paymentMethod === pm.value && [styles.chipActive, { backgroundColor: colors.accent }]]}
                onPress={() => setPaymentMethod(pm.value)}>
                <Text style={[styles.chipText, { color: colors.textSecondary }, paymentMethod === pm.value && [styles.chipTextActive, { color: colors.black }]]}>{pm.value === 'cash' ? t('cash') : t('mobileMoneyMomo')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('notes')}</Text>
          <TextInput
            style={[styles.notesInput, { color: colors.textPrimary }]}
            placeholder={t('optionalNotes')}
            placeholderTextColor={colors.textSecondary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        <View style={{ marginTop: 8 }}>
          <PrimaryButton title={loading ? t('saving') : t('saveChanges')} onPress={handleSave} variant="yellow" />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  headerRight: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24 },
  amountSection: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    paddingVertical: 8,
  },
  currency: { fontSize: 16, fontFamily: FontFamily.regular },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  typeIncomeActive: {
    // inline
  },
  typeExpenseActive: {
    // inline
  },
  typeText: { fontSize: 16, fontFamily: FontFamily.semiBold },
  typeIncomeText: {
    // inline
  },
  typeExpenseText: {
    // inline
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    marginBottom: 12,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  chipActive: {},
  chipText: { fontSize: 14, fontFamily: FontFamily.medium },
  chipTextActive: {},
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addChipText: { fontSize: 14, fontFamily: FontFamily.medium },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  addCategoryInput: {
    flex: 1,
    minWidth: 120,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  addCategoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addCategoryBtnText: { fontSize: 14, fontFamily: FontFamily.semiBold },
  cancelText: { fontSize: 14, fontFamily: FontFamily.medium },
  notesInput: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    paddingVertical: 4,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
