// Transactions: list with filters, add, multi-select (change category / export transaction/ delete).
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useRouter } from 'expo-router';
import { TabHeader } from '../../components/TabHeader';
import { useThemeColors } from '../../contexts/ThemeContext';
import { useTranslations } from '../../hooks/useTranslations';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { useAlertsCheck } from '../../hooks/useAlertsCheck';
import { useCategorySuggestion } from '../../hooks/useCategorySuggestion';
import { useAddTransaction } from '../../hooks/useAddTransaction';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { BulkChangeCategoryModal } from '../../components/BulkActionsModal';
import { deleteTransactions, updateTransactionsCategory } from '../../services/transactionsService';
import { buildTransactionsCsv } from '../../utils/csvExport';
import { showConfirm } from '../../services/errorPresenter';
import { FontFamily } from '../../constants/colors';
import { formatRWFWithSign } from '../../utils/formatCurrency';
import { formatTransactionDate, formatShortDate } from '../../utils/formatDate';
import { filterTransactions } from '../../utils/filterTransactions';
import { groupTransactionsByDate } from '../../utils/transactionGrouping';
import { getTransactionCategoryIcon } from '../../utils/transactionCategoryIcon';
import { translateCategory } from '../../utils/translateCategory';
import type { FilterTab, DateRangeFilter, PaymentFilter } from '../../types/transaction';

const DATE_RANGES: { value: DateRangeFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'today', labelKey: 'filterToday' },
  { value: 'week', labelKey: 'filterThisWeek' },
  { value: 'month', labelKey: 'filterThisMonth' },
  { value: '30days', labelKey: 'filterLast30Days' },
  { value: 'custom', labelKey: 'filterCustom' },
];

const PAYMENT_OPTIONS: { value: PaymentFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'filterAll' },
  { value: 'cash', labelKey: 'cash' },
  { value: 'mobile_money', labelKey: 'mobileMoney' },
];

function getDateRangeLabel(dateRange: DateRangeFilter, from?: Date, to?: Date, t?: (k: string) => string): string {
  if (dateRange === 'custom' && from && to && t) {
    return `${formatShortDate(from)} – ${formatShortDate(to)}`;
  }
  if (!t) return '';
  const item = DATE_RANGES.find((d) => d.value === dateRange);
  return item ? t(item.labelKey) : '';
}

export default function TransactionsScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all');
  const [customStartDate, setCustomStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [customEndDate, setCustomEndDate] = useState<Date>(() => new Date());
  const [category, setCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentFilter>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState<'from' | 'to' | null>(null);

  const { userId } = useCurrentUser();
  const { transactions, loading } = useTransactions(userId!);
  const { categories } = useCategories(userId);
  const { anomalousIds } = useAlertsCheck(userId, transactions);
  const { suggest } = useCategorySuggestion(userId, transactions);
  const { addTransaction } = useAddTransaction(userId!);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [changeCategoryModalVisible, setChangeCategoryModalVisible] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState<{ deleted: number; total: number } | null>(null);

  const filters = {
    type: filter,
    dateRange,
    customStartDate: dateRange === 'custom' ? customStartDate : undefined,
    customEndDate: dateRange === 'custom' ? customEndDate : undefined,
    category,
    paymentMethod,
    search,
  };
  const filtered = filterTransactions(transactions, filters);
  const dateGroups = groupTransactionsByDate(filtered, t);

  const hasActiveFilters =
    filter !== 'all' || dateRange !== 'all' || category !== '' || paymentMethod !== 'all' || search.trim() !== '';

  const activeFilterSummary = hasActiveFilters
    ? [
        search.trim() && `"${search.trim()}"`,
        filter !== 'all' && t(filter),
        dateRange !== 'all' && getDateRangeLabel(dateRange, customStartDate, customEndDate, t),
        category && category,
        paymentMethod !== 'all' && t(paymentMethod === 'cash' ? 'cash' : 'mobileMoney'),
      ]
        .filter(Boolean)
        .join(' • ')
    : '';

  const onDateChange = (mode: 'from' | 'to') => (_: any, date?: Date) => {
    if (Platform.OS === 'android') setDatePickerMode(null);
    if (date) {
      if (mode === 'from') setCustomStartDate(date);
      else setCustomEndDate(date);
    }
  };

  const applyFilters = () => setFilterModalVisible(false);

  const clearFilters = () => {
    setFilter('all');
    setDateRange('all');
    setCategory('');
    setPaymentMethod('all');
    setSearch('');
    setFilterModalVisible(false);
  };


  function toggleSelectMode() {
    if (selectMode) {
      setSelectMode(false);
      setSelectedIds(new Set());
    } else {
      setSelectMode(true);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleBulkAction(action: 'delete' | 'changeCategory' | 'export') {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    if (action === 'delete') {
      showConfirm(
        t('deleteSelected'),
        t('bulkDeleteConfirm', { count: ids.length }),
        async () => {
          setBulkLoading(true);
          setBulkDeleteProgress({ deleted: 0, total: ids.length });
          try {
            await deleteTransactions(ids, (deleted, total) => {
              setBulkDeleteProgress({ deleted, total });
            });
            setSelectedIds(new Set());
            setSelectMode(false);
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : t('couldNotDeleteTransaction');
            showConfirm(
              t('error'),
              errorMsg,
              () => {},
              { confirmText: t('ok') }
            );
          } finally {
            setBulkLoading(false);
            setBulkDeleteProgress(null);
          }
        },
        { confirmText: t('delete'), destructive: true }
      );
    } else if (action === 'changeCategory') {
      setChangeCategoryModalVisible(true);
    } else if (action === 'export') {
      const selectedTxs = transactions.filter((tx) => selectedIds.has(tx.id));
      const csv = buildTransactionsCsv(selectedTxs);
      const filename = `mobiflow-selected-${new Date().toISOString().slice(0, 10)}.csv`;
      // Fallback if cache dir missing
      const cacheDir = (FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? '';
      const uri = cacheDir ? `${cacheDir}${filename}` : filename;
      FileSystem.writeAsStringAsync(uri, csv, { encoding: 'utf8' as any }).then(
        async () => {
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: t('exportSelected') });
          }
          setSelectedIds(new Set());
          setSelectMode(false);
        }
      );
    }
  }

  async function handleBulkChangeCategory(category: string) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setChangeCategoryModalVisible(false);
    setBulkLoading(true);
    try {
      await updateTransactionsCategory(ids, category);
      setSelectedIds(new Set());
      setSelectMode(false);
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <TabHeader
        title={t('transactions')}
        subtitle={selectMode ? t('selectedCount', { count: selectedIds.size }) : t('transactionsSubtitle')}
        rightContent={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerIconBtn, { backgroundColor: colors.background }]}
              onPress={() => setFilterModalVisible(true)}>
              <Ionicons
                name="options-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.selectModeBtn, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}
              onPress={selectMode ? toggleSelectMode : () => setSelectMode(true)}>
              <Text style={[styles.selectModeText, { color: colors.textPrimary }]}>
                {selectMode ? t('cancelSelect') : t('bulkSelect')}
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      <View style={[styles.searchRow, { backgroundColor: colors.surfaceElevated }]}>
        <View style={[styles.searchWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterCard,
            { backgroundColor: filter === 'all' ? colors.accent : colors.background, borderColor: filter === 'all' ? colors.accent : colors.border },
          ]}
          onPress={() => setFilter('all')}>
          <Text style={[styles.filterPillText, { color: filter === 'all' ? colors.black : colors.textSecondary }]}>
            {t('filterAll')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterCard,
            { backgroundColor: filter === 'income' ? colors.success + '30' : colors.background, borderColor: filter === 'income' ? colors.success + '60' : colors.border },
          ]}
          onPress={() => setFilter('income')}>
          <Text style={[styles.filterPillText, { color: filter === 'income' ? colors.success : colors.textSecondary }]}>
            {t('income')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterCard,
            { backgroundColor: filter === 'expense' ? colors.error + '20' : colors.background, borderColor: filter === 'expense' ? colors.error + '50' : colors.border },
          ]}
          onPress={() => setFilter('expense')}>
          <Text style={[styles.filterPillText, { color: filter === 'expense' ? colors.error : colors.textSecondary }]}>
            {t('expense')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterCard,
            { backgroundColor: dateRange === 'month' ? colors.accent : colors.background, borderColor: dateRange === 'month' ? colors.accent : colors.border },
          ]}
          onPress={() => setDateRange(dateRange === 'month' ? 'all' : 'month')}>
          <Text style={[styles.filterPillText, { color: dateRange === 'month' ? colors.black : colors.textSecondary }]}>
            {t('filterThisMonth')}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={filterModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('filters')}</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalSection, { color: colors.textSecondary }]}>
                {t('filterCategory')}
              </Text>
              <View style={styles.modalOptions}>
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    { borderBottomColor: colors.border },
                    !category && { backgroundColor: colors.primary + '18' },
                  ]}
                  onPress={() => setCategory('')}>
                  <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>{t('filterAll')}</Text>
                  {!category && <Ionicons name="checkmark" size={18} color={colors.white} />}
                </TouchableOpacity>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.name}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      category === c.name && { backgroundColor: colors.primary + '18' },
                    ]}
                    onPress={() => setCategory(c.name)}>
                    <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>{c.name}</Text>
                    {category === c.name && <Ionicons name="checkmark" size={18} color={colors.white} />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSection, { color: colors.textSecondary }]}>
                {t('filterPayment')}
              </Text>
              <View style={styles.modalOptions}>
                {PAYMENT_OPTIONS.map(({ value, labelKey }) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      paymentMethod === value && { backgroundColor: colors.primary + '18' },
                    ]}
                    onPress={() => setPaymentMethod(value)}>
                    <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>{t(labelKey)}</Text>
                    {paymentMethod === value && <Ionicons name="checkmark" size={18} color={colors.white} />}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalSection, { color: colors.textSecondary }]}>Date</Text>
              <View style={styles.modalOptions}>
                {DATE_RANGES.map(({ value, labelKey }) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      dateRange === value && { backgroundColor: colors.primary + '18' },
                    ]}
                    onPress={() => setDateRange(value)}>
                    <Text style={[styles.modalOptionText, { color: colors.textPrimary }]}>
                      {value === 'custom'
                        ? `${t(labelKey)}${dateRange === 'custom' ? ` (${formatShortDate(customStartDate)} – ${formatShortDate(customEndDate)})` : ''}`
                        : t(labelKey)}
                    </Text>
                    {dateRange === value && <Ionicons name="checkmark" size={18} color={colors.white} />}
                  </TouchableOpacity>
                ))}
              </View>

              {dateRange === 'custom' && (
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={[styles.dateBtn, { backgroundColor: colors.background }]}
                    onPress={() => setDatePickerMode('from')}>
                    <Ionicons name="calendar-outline" size={18} color={colors.listIcon ?? colors.primary} />
                    <Text style={[styles.dateBtnText, { color: colors.textPrimary }]}>
                      {t('pickDateFrom')}: {formatShortDate(customStartDate)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.dateBtn, { backgroundColor: colors.background }]}
                    onPress={() => setDatePickerMode('to')}>
                    <Ionicons name="calendar-outline" size={18} color={colors.listIcon ?? colors.primary} />
                    <Text style={[styles.dateBtnText, { color: colors.textPrimary }]}>
                      {t('pickDateTo')}: {formatShortDate(customEndDate)}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={clearFilters}>
                <Text style={[styles.modalActionText, { color: colors.textPrimary }]}>
                  {t('clearFilters')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={applyFilters}>
                <Text style={[styles.modalActionText, { color: colors.textPrimary }]}>
                  {t('applyFilters')}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </TouchableOpacity>
      </Modal>

      {datePickerMode && (
        Platform.OS === 'ios' ? (
          <Modal transparent visible animationType="slide">
            <TouchableOpacity style={styles.datePickerOverlay} activeOpacity={1} onPress={() => setDatePickerMode(null)}>
              <View style={[styles.datePickerContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.datePickerHeader}>
                  <TouchableOpacity onPress={() => setDatePickerMode(null)}>
                    <Text style={[styles.datePickerDone, { color: colors.listIcon ?? colors.primary }]}>{t('done')}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={datePickerMode === 'from' ? customStartDate : customEndDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange(datePickerMode)}
                  maximumDate={datePickerMode === 'from' ? customEndDate : new Date()}
                  minimumDate={datePickerMode === 'to' ? customStartDate : undefined}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={datePickerMode === 'from' ? customStartDate : customEndDate}
            mode="date"
            display="default"
            onChange={onDateChange(datePickerMode)}
            maximumDate={datePickerMode === 'from' ? customEndDate : new Date()}
            minimumDate={datePickerMode === 'to' ? customStartDate : undefined}
          />
        )
      )}

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}>
        {loading && transactions.length === 0 ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={colors.listIcon ?? colors.primary} />
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>{t('loading') || 'Loading...'}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textPrimary }]}>
              {transactions.length === 0 ? t('noTransactionsYet') : (t('noMatchingTransactions') || 'No transactions match your filters')}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
              {transactions.length === 0 ? t('tapAddFirst') : (t('tryClearFilters') || 'Try clearing filters or change date/type')}
            </Text>
            {transactions.length > 0 && hasActiveFilters && (
              <TouchableOpacity
                style={[styles.filterPill, { backgroundColor: colors.surface, marginTop: 12 }]}
                onPress={clearFilters}>
                <Text style={[styles.filterPillText, { color: colors.listIcon ?? colors.primary }]}>{t('clearFilters')}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          dateGroups.map((group) => (
            <View key={group.dateKey} style={styles.dateGroup}>
              <View style={styles.dateGroupHeader}>
                <Text style={[styles.dateGroupLabel, { color: colors.textPrimary }]}>{group.label}</Text>
                <Text style={[styles.dateGroupSummary, { color: colors.textSecondary }]}>
                  {group.transactions.length} {group.transactions.length === 1 ? 'transaction' : 'transactions'}
                  {' • '}
                  <Text style={{ color: group.net >= 0 ? colors.success : colors.error }}>
                    {formatRWFWithSign(group.net)}
                  </Text>
                </Text>
              </View>
              <View style={styles.transactionCards}>
                {group.transactions.map((tx) => {
                  const catIcon = getTransactionCategoryIcon(tx.category ?? 'Other', tx.type);
                  return (
                    <TouchableOpacity
                      key={tx.id}
                      style={[
                        styles.transactionCard,
                        { backgroundColor: colors.background, borderColor: colors.border },
                        selectMode && selectedIds.has(tx.id) && { borderColor: colors.primary, backgroundColor: colors.primary + '12' },
                      ]}
                      onPress={() => {
                        if (selectMode) {
                          toggleSelect(tx.id);
                        } else {
                          router.push({ pathname: '/transaction-detail/[id]', params: { id: tx.id } } as any);
                        }
                      }}
                      activeOpacity={0.7}>
                      {selectMode && (
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: colors.border },
                            selectedIds.has(tx.id) && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}>
                          {selectedIds.has(tx.id) && <Ionicons name="checkmark" size={14} color={colors.white} />}
                        </View>
                      )}
                      <View style={[styles.categoryIconWrap, { backgroundColor: catIcon.backgroundColor }]}>
                        <Ionicons name={catIcon.icon} size={20} color={catIcon.iconColor} />
                      </View>
                      <View style={styles.transactionCardBody}>
                        <View style={styles.transactionLabelRow}>
                          <Text style={[styles.transactionLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                            {tx.displayLabel ?? tx.label}
                          </Text>
                          {anomalousIds.has(tx.id) && (
                            <View style={[styles.unusualBadge, { backgroundColor: colors.warningBg }]}>
                              <Text style={[styles.unusualBadgeText, { color: colors.warningText }]}>{t('unusualTransaction')}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.transactionMeta, { color: colors.textSecondary }]}>
                          {translateCategory(tx.category ?? 'Other', t)} • {formatTransactionDate(tx.createdAt)}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.transactionAmount,
                          { color: tx.type === 'income' ? colors.success : colors.error },
                        ]}>
                        {formatRWFWithSign(tx.amount)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {selectMode && selectedIds.size > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.bulkBarBtn, { borderColor: colors.border }]}
            onPress={() => handleBulkAction('changeCategory')}
            disabled={bulkLoading}>
            <Ionicons name="pricetag-outline" size={22} color={colors.listIcon ?? colors.primary} />
            <Text style={[styles.bulkBarBtnText, { color: colors.textPrimary }]}>{t('changeCategory')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkBarBtn, { borderColor: colors.border }]}
            onPress={() => handleBulkAction('export')}
            disabled={bulkLoading}>
            <Ionicons name="document-text-outline" size={22} color={colors.listIcon ?? colors.primary} />
            <Text style={[styles.bulkBarBtnText, { color: colors.textPrimary }]}>{t('exportSelected')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkBarBtn, { borderColor: colors.border }]}
            onPress={() => handleBulkAction('delete')}
            disabled={bulkLoading}>
            {bulkLoading ? (
              <View style={styles.bulkBarBtnProgress}>
                <ActivityIndicator size="small" color={colors.listIcon ?? colors.primary} />
                {bulkDeleteProgress && (
                  <Text style={[styles.bulkBarBtnProgressText, { color: colors.textPrimary }]}>
                    {bulkDeleteProgress.deleted}/{bulkDeleteProgress.total}
                  </Text>
                )}
              </View>
            ) : (
              <>
                <Ionicons name="trash-outline" size={22} color={colors.listIcon ?? colors.primary} />
                <Text style={[styles.bulkBarBtnText, { color: colors.textPrimary }]}>{t('deleteSelected')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
      <BulkChangeCategoryModal
        visible={changeCategoryModalVisible}
        onClose={() => setChangeCategoryModalVisible(false)}
        onSelect={handleBulkChangeCategory}
        categories={categories}
      />

      {!selectMode && (
        <Pressable
          style={[styles.fab, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/add-transaction')}>
          <Ionicons name="add" size={28} color={colors.black} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    gap: 10,
    marginBottom: 8,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  filterSummaryWrap: {
    marginHorizontal: 24,
    marginBottom: 8,
  },
  filterSummary: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 8,
    marginBottom: 20,
  },
  filterCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  filterPillText: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 16,
  },
  modalScroll: {
    maxHeight: 320,
  },
  modalSection: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    marginTop: 16,
    marginBottom: 6,
  },
  modalOptions: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  modalOptionText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  datePickerRow: {
    marginTop: 12,
    gap: 10,
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  dateBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalActionPrimary: {
    borderWidth: 0,
  },
  modalActionText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  modalActionPrimaryText: {},
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  datePickerContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 24,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  datePickerDone: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    flex: 1,
    paddingHorizontal: 24,
  },
  listContent: {
    paddingBottom: 120,
    flexGrow: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dateGroupLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  dateGroupSummary: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
  transactionCards: {
    gap: 10,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 0,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionCardBody: {
    flex: 1,
    minWidth: 0,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionMeta: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  iconIncome: {
    // inline
  },
  iconExpense: {
    // inline
  },
  transactionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  transactionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  unusualBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unusualBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.medium,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  amountIncome: {
    // inline
  },
  amountExpense: {
    // inline
  },
  fab: {
    position: 'absolute',
    bottom: 140,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  selectModeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectModeText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bulkBar: {
    position: 'absolute',
    bottom: 140,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  bulkBarBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bulkBarBtnDanger: {
    borderColor: 'transparent',
  },
  bulkBarBtnProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bulkBarBtnProgressText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
  bulkBarBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
  },
});
