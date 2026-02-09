// transactions list with filter tabs and add button
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useRouter } from 'expo-router';
import { TabHeader } from '../../components/TabHeader';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useTransactions } from '../../hooks/useTransactions';
import { MobiFlowColors, FontFamily } from '../../constants/colors';
import { formatRWFWithSign } from '../../utils/formatCurrency';
import { formatTransactionDate } from '../../utils/formatDate';
import { filterTransactions } from '../../utils/filterTransactions';
import type { FilterTab } from '../../types/transaction';

export default function TransactionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');

  const { userId } = useCurrentUser();
  const { transactions, loading } = useTransactions(userId!);
  const filtered = filterTransactions(transactions, filter, search);

  return (
    <View style={styles.container}>
      <TabHeader title="Transactions" subtitle="Add and view income & expenses" />
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={MobiFlowColors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          placeholderTextColor={MobiFlowColors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.tab, filter === 'all' && styles.tabActive]}
          onPress={() => setFilter('all')}>
          <Text style={[styles.tabText, filter === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'income' && styles.tabActive]}
          onPress={() => setFilter('income')}>
          <Text style={[styles.tabText, filter === 'income' && styles.tabTextActive]}>Income</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, filter === 'expense' && styles.tabActive]}
          onPress={() => setFilter('expense')}>
          <Text style={[styles.tabText, filter === 'expense' && styles.tabTextActive]}>Expense</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={MobiFlowColors.accent} />
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={MobiFlowColors.textSecondary} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySub}>Tap + to add your first transaction</Text>
            </View>
          ) : (
            filtered.map((t) => (
              <View key={t.id} style={styles.transactionRow}>
                <View style={styles.transactionLeft}>
                  <View style={[styles.iconWrap, t.type === 'income' ? styles.iconIncome : styles.iconExpense]}>
                    <Ionicons
                      name={t.type === 'income' ? 'arrow-up' : 'arrow-down'}
                      size={16}
                      color={t.type === 'income' ? '#22C55E' : '#EF4444'}
                    />
                  </View>
                  <View>
                    <Text style={styles.transactionLabel}>{t.label}</Text>
                    <Text style={styles.transactionDate}>{formatTransactionDate(t.createdAt)}</Text>
                  </View>
                </View>
                <Text style={[styles.transactionAmount, t.type === 'income' ? styles.amountIncome : styles.amountExpense]}>
                  {formatRWFWithSign(t.amount)}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
      <Pressable style={styles.fab} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={28} color={MobiFlowColors.black} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MobiFlowColors.background,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MobiFlowColors.surface,
    marginHorizontal: 24,
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textPrimary,
  },
  filterTabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: MobiFlowColors.accent,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
  },
  tabTextActive: {
    color: MobiFlowColors.black,
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
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
  },
  emptySub: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: MobiFlowColors.border,
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
  iconIncome: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  iconExpense: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  transactionLabel: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  amountIncome: {
    color: '#22C55E',
  },
  amountExpense: {
    color: '#EF4444',
  },
  fab: {
    position: 'absolute',
    bottom: 140,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: MobiFlowColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
});
