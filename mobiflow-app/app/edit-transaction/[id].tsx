// Edit transaction: form pre-filled, save changes. Category and payment via dropdowns like add screen.
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCategories } from '../../hooks/useCategories';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { updateTransaction } from '../../services/transactionsService';
import { saveDisplayLabel } from '../../services/localDisplayLabelsService';
import { saveDisplayNote } from '../../services/localDisplayNotesService';
import { saveCategoryCorrection, isGenericTransactionLabel } from '../../services/categorizationService';
import { cloudLabelForSmsTransaction } from '../../utils/smsTransactionPrivacy';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useTranslations } from '../../hooks/useTranslations';
import { getDisplayPhoneFromLabel } from '../../services/customerIdentificationService';
import { translateCategory } from '../../utils/translateCategory';
import { FontFamily } from '../../constants/colors';
import type { PaymentMethod } from '../../types/transaction';
import { showError } from '../../services/errorPresenter';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money (MTN MoMo)' },
];

const COMPACT_DROPDOWN_MAX_HEIGHT = 280;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function getCompactDropdownPosition(layout: { x: number; y: number; width: number; height: number }) {
  const spaceBelow = SCREEN_HEIGHT - layout.y - layout.height - 24;
  const showAbove = spaceBelow < 180;
  const maxH = Math.min(COMPACT_DROPDOWN_MAX_HEIGHT, showAbove ? layout.y - 24 : spaceBelow);
  const top = showAbove ? layout.y - maxH - 4 : layout.y + layout.height + 4;
  return { top, left: layout.x, width: layout.width, maxHeight: maxH };
}

export default function EditTransactionScreen() {
  const router = useRouter();
  const { t } = useTranslations();
  const { colors, isDark } = useThemeColors();
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const categoryTriggerRef = useRef<View>(null);
  const paymentTriggerRef = useRef<View>(null);

  const tx = transactions.find((t) => t.id === params.id);

  function openCategoryDropdown() {
    categoryTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout({ x, y, width, height });
      setShowCategoryModal(true);
    });
  }

  function openPaymentDropdown() {
    paymentTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout({ x, y, width, height });
      setShowPaymentModal(true);
    });
  }

  useEffect(() => {
    if (tx) {
      setLabel(tx.displayLabel ?? tx.label);
      setAmount(String(Math.abs(tx.amount)));
      setType(tx.type);
      setCategory(tx.category);
      setPaymentMethod(tx.paymentMethod ?? 'mobile_money');
      setNotes(tx.displayNotes ?? tx.notes ?? '');
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
      showError(t('error'), t('transactionNotFound'));
      return false;
    }
    setLoading(true);
    try {
      const userFacingLabel = label.trim();
      const cloudLabel = cloudLabelForSmsTransaction(type);
      if (userId) {
        await saveDisplayLabel(userId, params.id, userFacingLabel);
        await saveDisplayNote(userId, params.id, notes);
      }
      await updateTransaction(params.id, {
        label: cloudLabel,
        amount: amt,
        type,
        category,
        paymentMethod,
        notes: '',
      });
      if (
        userId &&
        category !== tx.category &&
        userFacingLabel &&
        !isGenericTransactionLabel(userFacingLabel)
      ) {
        await saveCategoryCorrection(userId, userFacingLabel, category);
      }
      Alert.alert(t('saved'), t('savedMessage'), [{ text: t('ok'), onPress: () => router.back() }]);
    } catch {
      showError(t('error'), t('couldNotUpdateTransaction'));
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    const result = await addCategory(name);
    if (result === 'duplicate') {
      showError(t('duplicateCategoryTitle'), t('duplicateCategoryMessage'));
      return;
    }
    if (result) {
      setCategory(result.name);
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  }

  if (!params.id) {
    router.back();
    return null;
  }

  if (!tx) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background, padding: 24 }]}>
        <Text style={[styles.notFoundText, { color: colors.textSecondary }]}>{t('transactionNotFound')}</Text>
        <TouchableOpacity style={[styles.goBackBtn, { backgroundColor: colors.accent }]} onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={[styles.goBackBtnText, { color: colors.onAccent }]}>{t('goBack')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dropdownSelectedBg = isDark ? 'rgba(255,255,255,0.08)' : colors.surface;

  const senderPhone = getDisplayPhoneFromLabel(label);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('editTransaction')} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.amountSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
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
          {senderPhone && (
            <View style={[styles.detailRow, { marginBottom: 12 }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('phoneNumber')}</Text>
              <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{senderPhone}</Text>
            </View>
          )}
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
          <View ref={categoryTriggerRef} collapsable={false}>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={openCategoryDropdown}
              activeOpacity={0.7}>
              <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>{translateCategory(category, t)}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('paymentMethod')}</Text>
          <View ref={paymentTriggerRef} collapsable={false}>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={openPaymentDropdown}
              activeOpacity={0.7}>
              <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                {paymentMethod === 'cash' ? t('cash') : t('mobileMoneyMomo')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {showAddCategory && (
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('newCategory')}</Text>
            <View style={styles.addCategoryRow}>
              <TextInput
                style={[styles.addCategoryInput, { backgroundColor: colors.surface, color: colors.textPrimary }]}
                placeholder={t('categoryName')}
                placeholderTextColor={colors.textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
              <TouchableOpacity style={[styles.addCategoryBtn, { backgroundColor: colors.accent }]} onPress={handleAddCategory}>
                <Text style={[styles.addCategoryBtnText, { color: colors.onAccent }]}>{t('add')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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

      <Modal visible={showCategoryModal} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowCategoryModal(false)}>
          {dropdownLayout && (
            <View style={[styles.compactDropdownWrap, getCompactDropdownPosition(dropdownLayout)]} onStartShouldSetResponder={() => true}>
              <View style={[styles.compactDropdownPanel, styles.dropdownPanel, styles.dropdownPanelShadow, { backgroundColor: colors.background }]}>
                <Text style={[styles.compactDropdownTitle, { color: colors.textPrimary }]}>{t('selectCategory')}</Text>
                <ScrollView style={styles.compactDropdownScroll} showsVerticalScrollIndicator={false}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id ?? c.name}
                      style={[styles.dropdownItem, category === c.name && { backgroundColor: dropdownSelectedBg }]}
                      onPress={() => { setCategory(c.name); setShowCategoryModal(false); }}
                      activeOpacity={0.7}>
                      <Text style={[styles.dropdownItemText, { color: colors.textPrimary }, category === c.name && styles.dropdownItemTextSelected]}>{translateCategory(c.name, t)}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => { setShowCategoryModal(false); setShowAddCategory(true); }}
                    activeOpacity={0.7}>
                    <View style={styles.dropdownItemLeft}>
                      <Ionicons name="add" size={18} color={colors.textSecondary} />
                      <Text style={[styles.dropdownItemText, { color: colors.textSecondary }]}>{t('addCategory')}</Text>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          )}
        </Pressable>
      </Modal>

      <Modal visible={showPaymentModal} transparent animationType="fade">
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowPaymentModal(false)}>
          {dropdownLayout && (
            <View style={[styles.compactDropdownWrap, getCompactDropdownPosition(dropdownLayout)]} onStartShouldSetResponder={() => true}>
              <View style={[styles.compactDropdownPanel, styles.dropdownPanel, styles.dropdownPanelShadow, { backgroundColor: colors.background }]}>
                <Text style={[styles.compactDropdownTitle, { color: colors.textPrimary }]}>{t('selectPaymentMethod')}</Text>
                <View style={styles.modalOptions}>
                  {PAYMENT_METHODS.map((pm) => (
                    <TouchableOpacity
                      key={pm.value}
                      style={[styles.dropdownItem, paymentMethod === pm.value && { backgroundColor: dropdownSelectedBg }]}
                      onPress={() => { setPaymentMethod(pm.value); setShowPaymentModal(false); }}
                      activeOpacity={0.7}>
                      <Text style={[styles.dropdownItemText, { color: colors.textPrimary }, paymentMethod === pm.value && styles.dropdownItemTextSelected]}>
                        {pm.value === 'cash' ? t('cash') : t('mobileMoneyMomo')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24 },
  amountSection: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  amountLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    marginBottom: 6,
  },
  amountInput: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    paddingVertical: 2,
  },
  currency: { fontSize: 16, fontFamily: FontFamily.regular },
  notFoundText: { fontSize: 16, fontFamily: FontFamily.regular, textAlign: 'center', marginBottom: 20 },
  goBackBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  goBackBtnText: { fontSize: 16, fontFamily: FontFamily.semiBold },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: { fontSize: 16, fontFamily: FontFamily.medium },
  modalOverlay: { flex: 1 },
  compactDropdownWrap: { position: 'absolute' as const },
  compactDropdownPanel: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingBottom: 12,
    minWidth: 200,
  },
  compactDropdownTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  compactDropdownScroll: { maxHeight: 240, paddingHorizontal: 8 },
  dropdownPanel: { elevation: 8 },
  dropdownPanelShadow: Platform.select({
    web: { boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  }),
  modalOptions: { paddingHorizontal: 16 },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  dropdownItemText: { fontSize: 16, fontFamily: FontFamily.regular },
  dropdownItemTextSelected: { fontFamily: FontFamily.semiBold },
  dropdownItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
