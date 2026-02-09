// Full-screen Add Transaction page - matches Figma design
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useAddTransaction } from '../hooks/useAddTransaction';
import { useCategories } from '../hooks/useCategories';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { PrimaryButton } from '../components/PrimaryButton';
import { MobiFlowColors, FontFamily } from '../constants/colors';

export default function AddTransactionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ userId?: string }>();
  const { userId } = useCurrentUser();
  const activeUserId = params.userId ?? userId ?? '';

  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('Other');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { addTransaction, loading } = useAddTransaction(activeUserId);
  const { categories, addCategory } = useCategories(activeUserId, 'open');

  async function handleSave() {
    const success = await addTransaction({
      label,
      amount: parseInt(amount, 10),
      type,
      category,
    });
    if (success) {
      router.back();
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

  if (!activeUserId) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={MobiFlowColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add transaction</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>Amount</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            placeholderTextColor={MobiFlowColors.textSecondary}
            value={amount}
            onChangeText={setAmount}
            keyboardType="number-pad"
          />
          <Text style={styles.currency}>RWF</Text>
        </View>

        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeIncomeActive]}
            onPress={() => setType('income')}>
            <Text style={[styles.typeText, type === 'income' && styles.typeIncomeText]}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeExpenseActive]}
            onPress={() => setType('expense')}>
            <Text style={[styles.typeText, type === 'expense' && styles.typeExpenseText]}>Expense</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Category</Text>
          <View style={styles.categoryChips}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id ?? c.name}
                style={[styles.chip, category === c.name && styles.chipActive]}
                onPress={() => setCategory(c.name)}>
                <Text style={[styles.chipText, category === c.name && styles.chipTextActive]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
            {showAddCategory ? (
              <View style={styles.addCategoryRow}>
                <TextInput
                  style={styles.addCategoryInput}
                  placeholder="New category"
                  placeholderTextColor={MobiFlowColors.textSecondary}
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                />
                <TouchableOpacity style={styles.addCategoryBtn} onPress={handleAddCategory}>
                  <Text style={styles.addCategoryBtnText}>Add</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addChip} onPress={() => setShowAddCategory(true)}>
                <Ionicons name="add" size={18} color={MobiFlowColors.accent} />
                <Text style={styles.addChipText}>Add category</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Payment method</Text>
          <Text style={styles.cardValue}>Mobile money</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Optional notes"
            placeholderTextColor={MobiFlowColors.textSecondary}
            value={label}
            onChangeText={setLabel}
            multiline
          />
        </View>

        <View style={{ marginTop: 8 }}>
          <PrimaryButton
            title={loading ? 'Saving...' : 'Save transaction'}
            onPress={handleSave}
            variant="yellow"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MobiFlowColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: MobiFlowColors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: MobiFlowColors.textPrimary,
    textAlign: 'center',
  },
  headerRight: { width: 32 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24 },
  amountSection: {
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    color: MobiFlowColors.textPrimary,
    paddingVertical: 8,
  },
  currency: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
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
    backgroundColor: MobiFlowColors.surface,
    alignItems: 'center',
  },
  typeIncomeActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  typeExpenseActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  typeText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textSecondary,
  },
  typeIncomeText: { color: '#22C55E' },
  typeExpenseText: { color: '#EF4444' },
  card: {
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
  },
  cardLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: MobiFlowColors.background,
  },
  chipActive: {
    backgroundColor: MobiFlowColors.accent,
  },
  chipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
  },
  chipTextActive: {
    color: MobiFlowColors.black,
  },
  addChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MobiFlowColors.accent,
    borderStyle: 'dashed',
  },
  addChipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.accent,
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
    backgroundColor: MobiFlowColors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textPrimary,
  },
  addCategoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: MobiFlowColors.accent,
    borderRadius: 10,
  },
  addCategoryBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.black,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
  },
  notesInput: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textPrimary,
    paddingVertical: 4,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
