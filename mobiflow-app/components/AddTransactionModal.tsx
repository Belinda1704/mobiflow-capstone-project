import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// popup form to add income or expense
import { useAddTransaction } from '../hooks/useAddTransaction';
import { useCategories } from '../hooks/useCategories';
import { PrimaryButton } from './PrimaryButton';
import { MobiFlowColors, FontFamily } from '../constants/colors';

type AddTransactionModalProps = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onAdded?: () => void;
};

export function AddTransactionModal({ visible, onClose, userId, onAdded }: AddTransactionModalProps) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('Other');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { addTransaction, loading } = useAddTransaction(userId);
  const { categories, addCategory } = useCategories(userId);

  async function handleAdd() {
    const success = await addTransaction({
      label,
      amount: parseInt(amount, 10),
      type,
      category,
    });
    if (success) {
      resetForm();
      onAdded?.();
      onClose();
    }
  }

  function resetForm() {
    setLabel('');
    setAmount('');
    setCategory('Other');
    setType('expense');
    setShowAddCategory(false);
    setNewCategoryName('');
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

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Transaction</Text>
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'expense' && styles.typeActive]}
                onPress={() => setType('expense')}>
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, type === 'income' && styles.typeActive]}
                onPress={() => setType('income')}>
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>Income</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grocery Sale, Rent Payment"
              placeholderTextColor={MobiFlowColors.textSecondary}
              value={label}
              onChangeText={setLabel}
            />
            <Text style={styles.label}>Amount (RWF)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={MobiFlowColors.textSecondary}
              value={amount}
              onChangeText={setAmount}
              keyboardType="number-pad"
            />
            <Text style={styles.label}>Category</Text>
            <View style={styles.categories}>
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.id ?? c.name}
                  style={[styles.categoryChip, category === c.name && styles.categoryChipActive]}
                  onPress={() => setCategory(c.name)}>
                  <Text style={[styles.categoryText, category === c.name && styles.categoryTextActive]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
              {showAddCategory ? (
                <View style={styles.addCategoryRow}>
                  <TextInput
                    style={styles.addCategoryInput}
                    placeholder="New category name"
                    placeholderTextColor={MobiFlowColors.textSecondary}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoFocus
                  />
                  <TouchableOpacity style={styles.addCategoryBtn} onPress={handleAddCategory}>
                    <Text style={styles.addCategoryBtnText}>Add</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowAddCategory(false); setNewCategoryName(''); }}>
                    <Text style={styles.cancelAddText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addCategoryChip}
                  onPress={() => setShowAddCategory(true)}>
                  <Ionicons name="add" size={18} color={MobiFlowColors.accent} />
                  <Text style={styles.addCategoryChipText}>Add category</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <PrimaryButton title={loading ? 'Adding...' : 'Add'} onPress={handleAdd} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: MobiFlowColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: MobiFlowColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: MobiFlowColors.textPrimary,
    marginBottom: 20,
  },
  form: {
    maxHeight: 320,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: MobiFlowColors.surface,
    alignItems: 'center',
  },
  typeActive: {
    backgroundColor: MobiFlowColors.accent,
  },
  typeText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
  },
  typeTextActive: {
    color: MobiFlowColors.black,
  },
  input: {
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textPrimary,
    marginBottom: 20,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: MobiFlowColors.surface,
  },
  categoryChipActive: {
    backgroundColor: MobiFlowColors.accent,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
  },
  categoryTextActive: {
    color: MobiFlowColors.black,
  },
  addCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MobiFlowColors.accent,
    borderStyle: 'dashed',
  },
  addCategoryChipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.accent,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addCategoryInput: {
    flex: 1,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textPrimary,
  },
  addCategoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: MobiFlowColors.accent,
    borderRadius: 10,
  },
  addCategoryBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.black,
  },
  cancelAddText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: MobiFlowColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textSecondary,
  },
});
