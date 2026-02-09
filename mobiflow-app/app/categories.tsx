import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { useCategories } from '../hooks/useCategories';
import { MobiFlowColors, FontFamily } from '../constants/colors';

export default function ManageCategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId } = useCurrentUser();
  const { customCategories, addCategory, updateCategory, removeCategory } = useCategories(userId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  function startEdit(id: string, name: string) {
    setEditingId(id);
    setEditName(name);
  }

  async function saveEdit() {
    if (!editingId || !editName.trim()) return;
    await updateCategory(editingId, editName.trim());
    setEditingId(null);
    setEditName('');
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    await addCategory(name);
    setNewName('');
    setShowAdd(false);
  }

  function confirmDelete(id: string, name: string) {
    Alert.alert(
      'Delete category',
      `Delete "${name}"? Transactions using it will show as "Other" in reports.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeCategory(id) },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={MobiFlowColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Categories</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Default categories (SME)</Text>
        <Text style={styles.sectionHint}>Supplies, Transport, Utilities, Rent, Salaries, Other</Text>

        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>Your custom categories</Text>
        {customCategories.map((c) => (
          <View key={c.id} style={styles.categoryRow}>
            {editingId === c.id ? (
              <>
                <TextInput
                  style={styles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  autoFocus
                  placeholder="Category name"
                  placeholderTextColor={MobiFlowColors.textSecondary}
                />
                <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setEditingId(null); setEditName(''); }}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.categoryName}>{c.name}</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => startEdit(c.id, c.name)}>
                  <Ionicons name="pencil-outline" size={20} color={MobiFlowColors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(c.id, c.name)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

        {showAdd ? (
          <View style={styles.addRow}>
            <TextInput
              style={styles.addInput}
              placeholder="New category name"
              placeholderTextColor={MobiFlowColors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowAdd(false); setNewName(''); }}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addCategoryRow} onPress={() => setShowAdd(true)}>
            <Ionicons name="add-circle-outline" size={24} color={MobiFlowColors.primary} />
            <Text style={styles.addCategoryText}>Add custom category</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: MobiFlowColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: MobiFlowColors.background,
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
  content: { flex: 1, padding: 24 },
  sectionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  iconBtn: { padding: 4 },
  editInput: {
    flex: 1,
    backgroundColor: MobiFlowColors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textPrimary,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: MobiFlowColors.accent,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.white,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  addInput: {
    flex: 1,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textPrimary,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
  },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: MobiFlowColors.accent,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.white,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MobiFlowColors.accent,
    borderStyle: 'dashed',
  },
  addCategoryText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.accent,
  },
});
