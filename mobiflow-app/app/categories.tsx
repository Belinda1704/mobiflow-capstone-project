// Categories: add/delete custom categories, list all.
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { useCategories } from '../hooks/useCategories';
import { showConfirm } from '../services/errorPresenter';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { ScreenHeader } from '../components/ScreenHeader';

export default function ManageCategoriesScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { customCategories, addCategory, updateCategory, removeCategory } = useCategories(userId || null, refreshTrigger);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Refresh categories when screen is focused (so categories added elsewhere appear)
  useFocusEffect(
    useCallback(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, [])
  );
  
  // Auth redirect
  if (!userId) {
    return null; // Auth redirect will handle navigation
  }

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
    showConfirm(
      t('deleteCategory'),
      t('deleteCategoryConfirm', { name }),
      () => removeCategory(id),
      { confirmText: t('delete'), destructive: true }
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('manageCategories')} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>{t('defaultCategoriesSME')}</Text>
        <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>{t('defaultCategoriesHint')}</Text>

        <Text style={[styles.sectionLabel, { marginTop: 24, color: colors.textPrimary }]}>{t('yourCustomCategories')}</Text>
        {customCategories.map((c) => (
          <View key={c.id} style={[styles.categoryRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {editingId === c.id ? (
              <View style={styles.editForm}>
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.editInput, { color: colors.textPrimary, backgroundColor: colors.background, borderColor: colors.border }]}
                    value={editName}
                    onChangeText={setEditName}
                    autoFocus
                    placeholder={t('categoryName')}
                    placeholderTextColor={colors.textSecondary}
                  />
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={saveEdit}>
                    <Text style={[styles.saveBtnText, { color: colors.white }]}>{t('save')}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.cancelRow}
                  onPress={() => { setEditingId(null); setEditName(''); }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Text style={[styles.cancelLink, { color: colors.textSecondary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{c.name}</Text>
                <TouchableOpacity style={styles.iconBtn} onPress={() => startEdit(c.id, c.name)}>
                  <Ionicons name="pencil-outline" size={20} color={colors.listIcon ?? colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => confirmDelete(c.id, c.name)}>
                  <Ionicons name="trash-outline" size={20} color={colors.listIcon ?? colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

        {showAdd ? (
          <View style={styles.addForm}>
            <View style={[styles.addRow, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.addInput, { color: colors.textPrimary, backgroundColor: colors.background, borderColor: colors.border }]}
                placeholder={t('newCategoryName')}
                placeholderTextColor={colors.textSecondary}
                value={newName}
                onChangeText={setNewName}
                autoFocus
              />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={handleAdd}>
                <Text style={[styles.addBtnText, { color: colors.white }]}>{t('add')}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.cancelRow}
              onPress={() => { setShowAdd(false); setNewName(''); }}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={[styles.cancelLink, { color: colors.textSecondary }]}>{t('cancel')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.addCategoryRow, { backgroundColor: colors.background, borderColor: colors.border }]} 
            onPress={() => setShowAdd(true)}>
            <Ionicons name="add-circle-outline" size={24} color={colors.textSecondary} />
            <Text style={[styles.addCategoryText, { color: colors.textPrimary }]}>{t('addCustomCategory')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 24 },
  sectionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  sectionHint: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 12,
    borderWidth: 1,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  iconBtn: { padding: 4 },
  editForm: {
    flex: 1,
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: FontFamily.regular,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  cancelText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  addForm: {
    marginTop: 16,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addInput: {
    flex: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    borderWidth: 1,
  },
  addBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  cancelRow: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  cancelLink: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'solid',
  },
  addCategoryText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
});
