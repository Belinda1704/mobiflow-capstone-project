// Add transaction. User enters label, amount, type, category, payment. Saves to Firestore then back.
import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAddTransaction } from '../hooks/useAddTransaction';
import { useCategories } from '../hooks/useCategories';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactions } from '../hooks/useTransactions';
import { useCategorySuggestion } from '../hooks/useCategorySuggestion';
import { PrimaryButton } from '../components/PrimaryButton';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { translateCategory } from '../utils/translateCategory';
import { FontFamily } from '../constants/colors';
import type { PaymentMethod } from '../types/transaction';
import { computeTopCustomers } from '../services/customerIdentificationService';
import { isUnusualAmount } from '../utils/anomalyDetection';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'mobile_money', label: 'Mobile money (MTN MoMo)' },
];

const COMPACT_DROPDOWN_MAX_HEIGHT = 280;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AddTransactionScreen() {
  const router = useRouter();
  const { t } = useTranslations();
  const { colors, isDark } = useThemeColors();
  const dropdownSelectedBg = isDark ? 'rgba(255,255,255,0.08)' : colors.surface;
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string }>();
  const { userId } = useCurrentUser();
  const activeUserId = params.userId ?? userId ?? '';

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('Other');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  const [senderPhone, setSenderPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [dropdownLayout, setDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const categoryTriggerRef = useRef<View>(null);
  const paymentTriggerRef = useRef<View>(null);

  const { addTransaction, loading } = useAddTransaction(activeUserId);
  const [saved, setSaved] = useState(false);
  const { categories, addCategory } = useCategories(activeUserId, 'open');
  const { transactions } = useTransactions(activeUserId);
  const { suggest } = useCategorySuggestion(activeUserId, transactions);
  const userPickedCategory = useRef(false);
  const recentSenders = type === 'income' && paymentMethod === 'mobile_money'
    ? computeTopCustomers(transactions, 8)
    : [];

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

  function getCompactDropdownPosition(layout: { x: number; y: number; width: number; height: number }) {
    const spaceBelow = SCREEN_HEIGHT - layout.y - layout.height - 24;
    const showAbove = spaceBelow < 180;
    const maxH = Math.min(COMPACT_DROPDOWN_MAX_HEIGHT, showAbove ? layout.y - 24 : spaceBelow);
    const top = showAbove ? layout.y - maxH - 4 : layout.y + layout.height + 4;
    return { top, left: layout.x, width: layout.width, maxHeight: maxH };
  }

  useEffect(() => {
    if (!userPickedCategory.current && label.trim()) {
      const suggestion = suggest(label, type);
      if (suggestion && categories.some((c) => c.name === suggestion)) {
        setCategory(suggestion);
      }
    }
  }, [label, type, suggest, categories]);

  function normalizePhoneForLabel(raw: string): string {
    const digits = raw.replace(/\D/g, '');
    if (digits.length >= 9) {
      const rest = digits.startsWith('250') ? digits.slice(3) : digits;
      return rest.length === 9 && rest.startsWith('7') ? `0${rest}` : rest.slice(-9).replace(/^7/, '07');
    }
    return raw.trim();
  }

  async function handleSave() {
    let finalLabel = label.trim();
    if (type === 'income' && paymentMethod === 'mobile_money' && senderPhone.trim()) {
      const phone = normalizePhoneForLabel(senderPhone.trim());
      if (phone.length >= 9) {
        finalLabel = finalLabel ? `${finalLabel} from ${phone}` : `Payment from ${phone}`;
      }
    }
    const success = await addTransaction({
      label: finalLabel,
      amount: parseInt(amount, 10),
      type,
      category,
      paymentMethod,
      notes: notes.trim() || undefined,
    });
    if (success) {
      setSaved(true);
      setTimeout(() => router.back(), 1200);
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
      userPickedCategory.current = true;
    }
  }

  if (!activeUserId) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.surfaceElevated }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('addTransaction')}</Text>
        <View style={styles.headerRight} />
      </View>

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
          {amount.trim() && (() => {
            const num = parseInt(amount.replace(/\D/g, ''), 10);
            const signed = type === 'expense' ? -num : num;
            if (!isNaN(num) && num > 0 && isUnusualAmount(transactions, signed, type)) {
              return (
                <Text style={[styles.unusualHint, { color: colors.warning }]}>{t('unusualAmountHint')}</Text>
              );
            }
            return null;
          })()}
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
            style={[styles.typeBtn, { backgroundColor: colors.background }, type === 'income' && { ...styles.typeIncomeActive, borderColor: colors.success, backgroundColor: colors.success + '26' }]}
            onPress={() => { setType('income'); userPickedCategory.current = false; }}>
            <Text style={[styles.typeText, { color: type === 'income' ? colors.success : colors.textSecondary }]}>{t('income')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, { backgroundColor: colors.background }, type === 'expense' && { ...styles.typeExpenseActive, borderColor: colors.error, backgroundColor: colors.error + '26' }]}
            onPress={() => { setType('expense'); userPickedCategory.current = false; }}>
            <Text style={[styles.typeText, { color: type === 'expense' ? colors.error : colors.textSecondary }]}>{t('expense')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('category')}</Text>
          <View ref={categoryTriggerRef} collapsable={false}>
            <TouchableOpacity
              style={[styles.dropdownButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={openCategoryDropdown}>
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
              onPress={openPaymentDropdown}>
              <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
                {paymentMethod === 'cash' ? t('cash') : t('mobileMoneyMomo')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {type === 'income' && paymentMethod === 'mobile_money' && (
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>{t('senderPhoneLabel')}</Text>
            {recentSenders.length > 0 && (
              <>
                <Text style={[styles.chipHint, { color: colors.textSecondary }]}>{t('whoSentTap')}</Text>
                <View style={styles.chipRow}>
                  {recentSenders.map((c) => (
                    <TouchableOpacity
                      key={c.phone}
                      style={[
                        styles.senderChip,
                        { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                        senderPhone === c.phone && { borderColor: colors.accent, backgroundColor: colors.accent + '26' },
                      ]}
                      onPress={() => setSenderPhone(senderPhone === c.phone ? '' : c.phone)}>
                      <Text style={[styles.senderChipText, { color: colors.textPrimary }]} numberOfLines={1}>{c.displayPhone}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
            <Text style={[styles.optionalLabel, { color: colors.textSecondary }]}>{t('orEnterNumber')}</Text>
            <TextInput
              style={[styles.notesInput, { color: colors.textPrimary, minHeight: undefined }]}
              placeholder={t('senderPhonePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={senderPhone}
              onChangeText={setSenderPhone}
              keyboardType="phone-pad"
            />
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
          <PrimaryButton
            title={saved ? t('saved') : loading ? t('saving') : t('saveTransaction')}
            onPress={handleSave}
            variant="yellow"
            disabled={loading || saved}
          />
        </View>
      </ScrollView>

      {/* Category Dropdown - compact panel below trigger */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          {dropdownLayout && (
            <View
              style={[styles.compactDropdownWrap, getCompactDropdownPosition(dropdownLayout)]}
              onStartShouldSetResponder={() => true}>
              <View style={[styles.compactDropdownPanel, styles.dropdownPanel, styles.dropdownPanelShadow, { backgroundColor: colors.background }]}>
                <Text style={[styles.compactDropdownTitle, { color: colors.textPrimary }]}>{t('selectCategory') || 'Select Category'}</Text>
                <ScrollView style={styles.compactDropdownScroll} showsVerticalScrollIndicator={false}>
                  {categories.map((c) => (
                    <TouchableOpacity
                      key={c.id ?? c.name}
                      style={[
                        styles.dropdownItem,
                        category === c.name && { backgroundColor: dropdownSelectedBg },
                      ]}
                      onPress={() => {
                        setCategory(c.name);
                        userPickedCategory.current = true;
                        setShowCategoryModal(false);
                      }}>
                      <Text style={[
                        styles.dropdownItemText,
                        { color: colors.textPrimary },
                        category === c.name && styles.dropdownItemTextSelected,
                      ]}>{translateCategory(c.name, t)}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={() => {
                      setShowCategoryModal(false);
                      setShowAddCategory(true);
                    }}>
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

      {/* Payment Method Dropdown - compact panel below trigger */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowPaymentModal(false)}>
          {dropdownLayout && (
            <View
              style={[styles.compactDropdownWrap, getCompactDropdownPosition(dropdownLayout)]}
              onStartShouldSetResponder={() => true}>
              <View style={[styles.compactDropdownPanel, styles.dropdownPanel, styles.dropdownPanelShadow, { backgroundColor: colors.background }]}>
                <Text style={[styles.compactDropdownTitle, { color: colors.textPrimary }]}>{t('selectPaymentMethod') || 'Select Payment Method'}</Text>
                <View style={styles.modalOptions}>
                  {PAYMENT_METHODS.map((pm) => (
                    <TouchableOpacity
                      key={pm.value}
                      style={[
                        styles.dropdownItem,
                        paymentMethod === pm.value && { backgroundColor: dropdownSelectedBg },
                      ]}
                      onPress={() => {
                        setPaymentMethod(pm.value);
                        setShowPaymentModal(false);
                      }}>
                      <Text style={[
                        styles.dropdownItemText,
                        { color: colors.textPrimary },
                        paymentMethod === pm.value && styles.dropdownItemTextSelected,
                      ]}>
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

      {/* Add Category Input Modal */}
      {showAddCategory && (
        <Modal visible={showAddCategory} transparent animationType="fade">
          <Pressable style={styles.modalOverlay} onPress={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
            <View style={[styles.addCategoryModal, { backgroundColor: colors.background }]} onStartShouldSetResponder={() => true}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('newCategory')}</Text>
              <TextInput
                style={[styles.addCategoryInputModal, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                placeholder={t('categoryName') || 'Category name'}
                placeholderTextColor={colors.textSecondary}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                autoFocus
              />
              <View style={styles.addCategoryActions}>
                <TouchableOpacity
                  style={[styles.addCategoryCancelBtn, { borderColor: colors.border }]}
                  onPress={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
                  <Text style={[styles.addCategoryCancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addCategorySaveBtn, { backgroundColor: colors.accent }]}
                  onPress={handleAddCategory}>
                  <Text style={[styles.addCategorySaveText, { color: colors.black }]}>{t('add')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  unusualHint: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    marginTop: 6,
  },
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
  typeIncomeActive: { borderWidth: 2 },
  typeExpenseActive: { borderWidth: 2 },
  typeText: { fontSize: 16, fontFamily: FontFamily.semiBold },
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
  cardValue: { fontSize: 16, fontFamily: FontFamily.medium },
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
  cardDescription: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
    marginTop: -4,
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
  chipHint: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  senderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  senderChipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    maxWidth: 100,
  },
  optionalLabel: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginBottom: 6,
  },
  notesInput: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    paddingVertical: 4,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  compactDropdownWrap: {
    position: 'absolute',
  },
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
  compactDropdownScroll: {
    maxHeight: 240,
    paddingHorizontal: 8,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 32,
    maxHeight: '80%',
  },
  dropdownPanel: { elevation: 8 },
  dropdownPanelShadow: Platform.select({
    web: { boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  }),
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 400,
    paddingHorizontal: 16,
  },
  modalOptions: {
    paddingHorizontal: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
  },
  dropdownItemTextSelected: {
    fontFamily: FontFamily.semiBold,
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  addCategoryModal: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 24,
  },
  addCategoryInputModal: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FontFamily.regular,
    borderWidth: 1,
    marginTop: 16,
    marginBottom: 20,
  },
  addCategoryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  addCategoryCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  addCategoryCancelText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  addCategorySaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addCategorySaveText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});
