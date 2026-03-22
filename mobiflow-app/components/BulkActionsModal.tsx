/**
 * Modal when user has selected several transactions: change category, export CSV, or delete.
 */
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

export type BulkAction = 'delete' | 'changeCategory' | 'export';

type BulkActionsModalProps = {
  visible: boolean;
  selectedCount: number;
  onClose: () => void;
  onAction: (action: BulkAction) => void;
  categories: { name: string }[];
  onSelectCategory?: (category: string) => void;
};

export function BulkActionsModal({
  visible,
  selectedCount,
  onClose,
  onAction,
  categories,
  onSelectCategory,
}: BulkActionsModalProps) {
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t('selectedCount', { count: selectedCount })}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('bulkChooseAction')}
          </Text>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onAction('changeCategory')}>
            <Ionicons name="pricetag-outline" size={22} color={colors.listIcon ?? colors.primary} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>{t('changeCategory')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onAction('export')}>
            <Ionicons name="document-text-outline" size={22} color={colors.listIcon ?? colors.primary} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>{t('exportSelected')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onAction('delete')}>
            <Ionicons name="trash-outline" size={22} color={colors.listIcon ?? colors.primary} />
            <Text style={[styles.actionText, { color: colors.textPrimary }]}>{t('deleteSelected')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surface }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('cancelSelect')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export type BulkChangeCategoryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  categories: { name: string }[];
};

export function BulkChangeCategoryModal({
  visible,
  onClose,
  onSelect,
  categories,
}: BulkChangeCategoryModalProps) {
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.background }]}
          onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('changeCategory')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('bulkSelectCategoryForTransactions')}
          </Text>
          <ScrollView style={styles.categoriesScroll} nestedScrollEnabled>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.name}
                style={[styles.categoryOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onSelect(c.name);
                  onClose();
                }}>
                <Text style={[styles.categoryText, { color: colors.textPrimary }]}>{c.name}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surface }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  deleteBtn: {},
  actionText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  categoriesScroll: {
    maxHeight: 280,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  categoryText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
});
