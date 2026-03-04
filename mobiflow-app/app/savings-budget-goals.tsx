// Savings goals and category budgets.
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { useTransactions } from '../hooks/useTransactions';
import { useSavingsGoals } from '../hooks/useSavingsGoals';
import { ScreenHeader } from '../components/ScreenHeader';
import { ProgressBar } from '../components/ProgressBar';
import { useThemeColors } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { useTranslations } from '../hooks/useTranslations';
import { translateCategory } from '../utils/translateCategory';
import { FontFamily } from '../constants/colors';
import { formatRWF } from '../utils/formatCurrency';
import { showError } from '../services/errorPresenter';
import { useGoalReminders } from '../hooks/useGoalReminders';

export default function SavingsBudgetGoalsScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const { transactions, loading } = useTransactions(userId || null);
  const {
    goals,
    budgets,
    topSpendingCategories,
    suggestedBudgets,
    suggestedSavingsGoal,
    addOrUpdateGoal,
    removeGoal,
    addOrUpdateBudget,
    loading: goalsLoading,
  } = useSavingsGoals(userId, transactions);

  const [showAddGoal, setShowAddGoal] = useState(false);
  const [celebratedGoalIds, setCelebratedGoalIds] = useState<Set<string>>(new Set());
  const [showCelebrationForGoal, setShowCelebrationForGoal] = useState<typeof goals[0] | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalDuration, setGoalDuration] = useState('');
  const [applyingSuggestions, setApplyingSuggestions] = useState(false);
  const [editingGoal, setEditingGoal] = useState<typeof goals[0] | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');

  // Pop celebration when a goal hits 100%
  useEffect(() => {
    const completed = goals.find((g) => g.percent >= 100 && !celebratedGoalIds.has(g.id));
    if (completed) {
      setCelebratedGoalIds((prev) => new Set(prev).add(completed.id));
      setShowCelebrationForGoal(completed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [goals, celebratedGoalIds]);

  useGoalReminders(userId ?? undefined, goals, t);

  async function handleApplySuggestions() {
    if (suggestedBudgets.length === 0) return;
    setApplyingSuggestions(true);
    try {
      for (const s of suggestedBudgets) {
        await addOrUpdateBudget(s.category, s.suggestedAmount);
      }
    } finally {
      setApplyingSuggestions(false);
    }
  }

  async function handleAddGoal() {
    const name = goalName.trim();
    const target = parseInt(goalTarget.replace(/\D/g, ''), 10);
    const durationNum = parseInt(goalDuration.replace(/\D/g, ''), 10);
    const durationMonths = !isNaN(durationNum) && durationNum > 0 ? durationNum : undefined;
    if (!name) {
      showError(t('error'), t('enterGoalName'));
      return;
    }
    if (isNaN(target) || target <= 0) {
      showError(t('error'), t('enterValidTargetAmount'));
      return;
    }
    const saved = await addOrUpdateGoal({
      name,
      target,
      current: 0,
      durationMonths,
    });
    if (saved) {
      setGoalName('');
      setGoalTarget('');
       setGoalDuration('');
      setShowAddGoal(false);
    }
  }

  async function handleAddContribution() {
    if (!editingGoal) return;
    const raw = contributionAmount.replace(/\D/g, '');
    const delta = parseInt(raw, 10);
    if (isNaN(delta) || delta <= 0) {
      showError(t('error'), t('enterValidTargetAmount'));
      return;
    }
    const currentBase = (editingGoal.current as number) || 0;
    const newCurrent = currentBase + delta;
    const saved = await addOrUpdateGoal({
      id: editingGoal.id,
      name: editingGoal.name,
      target: editingGoal.target,
      current: newCurrent,
      createdAt: editingGoal.createdAt,
      durationMonths: editingGoal.durationMonths,
    });
    if (saved) {
      setContributionAmount('');
      setEditingGoal(null);
    }
  }

  // Render straight away
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader
        title={t('savingsBudgetGoals')}
        rightContent={
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.accent }]} onPress={() => setShowAddGoal(true)}>
            <Text style={[styles.addBtnText, { color: colors.black }]}>+ {t('add')}</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('savingsGoals')}</Text>
          {goalsLoading ? (
            <ActivityIndicator size="small" color={colors.listIcon ?? colors.primary} />
          ) : goals.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noSavingsGoalsYet')}</Text>
            </View>
          ) : (
            goals.map((g) => (
              <View key={g.id} style={[styles.goalCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.goalHeader}>
                  <Text style={[styles.goalName, { color: colors.textPrimary }]}>{g.name}</Text>
                  <Text
                    style={[
                      styles.goalPercent,
                      { color: g.percent >= 100 ? colors.success : colors.textPrimary },
                    ]}>
                    {g.percent}%
                  </Text>
                </View>
                <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
                  {formatRWF(g.current)} of {formatRWF(g.target)}
                </Text>
                {typeof g.durationMonths === 'number' && g.durationMonths > 0 && (
                  <Text style={[styles.goalDuration, { color: colors.textSecondary }]}>
                    {g.durationMonths} month{g.durationMonths === 1 ? '' : 's'}
                  </Text>
                )}
                <ProgressBar
                  progress={g.percent}
                  color={g.percent >= 100 ? 'green' : g.percent >= 50 ? 'yellow' : 'yellow'}
                  height={10}
                />
                <View style={styles.goalActionsRow}>
                  <TouchableOpacity onPress={() => setEditingGoal(g)}>
                    <Text style={[styles.editGoalText, { color: colors.textPrimary }]}>{t('addToGoal')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeGoal(g.id)}>
                    <Text style={[styles.deleteGoalText, { color: colors.textPrimary }]}>{t('delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('expensesByCategory')}</Text>
          <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
            {topSpendingCategories.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('addTransactionsToSeeBreakdown')}</Text>
            ) : (
              topSpendingCategories.map((c) => (
                <View key={c.name} style={styles.categoryRow}>
                  <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{translateCategory(c.name, t)}</Text>
                  <Text style={[styles.categoryPercent, { color: colors.textPrimary }]}>{c.percent}%</Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('categoryBudgets')}</Text>
          {budgets.length === 0 && suggestedBudgets.length > 0 ? (
            <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.suggestedTitle, { color: colors.textPrimary }]}>{t('suggestedBudgets')}</Text>
              <Text style={[styles.suggestedSubtitle, { color: colors.textSecondary }]}>{t('suggestedBudgetsSubtitle')}</Text>
              {suggestedBudgets.slice(0, 6).map((s) => (
                <View key={s.category} style={[styles.suggestedRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.suggestedCategory, { color: colors.textPrimary }]}>{translateCategory(s.category, t)}</Text>
                  <Text style={[styles.suggestedAmount, { color: colors.textSecondary }]}>{formatRWF(s.suggestedAmount)}</Text>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.accent }]}
                onPress={handleApplySuggestions}
                disabled={applyingSuggestions}>
                <Text style={[styles.applyBtnText, { color: colors.black }]}>
                  {applyingSuggestions ? t('loading') : t('applySuggestedBudgets')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : budgets.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noCategoryBudgetsComingSoon')}</Text>
            </View>
          ) : (
            budgets.map((b) => (
              <View key={b.category} style={[styles.budgetCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.budgetName, { color: colors.textPrimary }]}>{b.category}</Text>
                <Text style={[styles.budgetAmount, { color: colors.textSecondary }]}>
                  {formatRWF(b.spent)} / {formatRWF(b.budget)}
                </Text>
                <ProgressBar
                  progress={b.percent}
                  color={b.percent >= 100 ? 'red' : b.percent >= 80 ? 'yellow' : 'green'}
                  height={10}
                />
              </View>
            ))
          )}
        </View>

      </ScrollView>

      <Modal visible={!!showCelebrationForGoal} transparent animationType="fade">
        <View style={styles.celebrationOverlay}>
          <View style={[styles.celebrationCard, { backgroundColor: colors.background }]}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={[styles.celebrationTitle, { color: colors.textPrimary }]}>{t('goalReachedCongratulations')}</Text>
            <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
              {t('goalReachedMessage', { name: showCelebrationForGoal?.name ?? '' })}
            </Text>
            <TouchableOpacity
              style={[styles.celebrationBtn, { backgroundColor: colors.accent }]}
              onPress={() => setShowCelebrationForGoal(null)}>
              <Text style={[styles.celebrationBtnText, { color: colors.black }]}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showAddGoal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddGoal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('addSavingsGoal')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                placeholder={t('goalNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={goalName}
                onChangeText={setGoalName}
              />
              {suggestedSavingsGoal && (
                <TouchableOpacity
                  style={[styles.suggestionChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  onPress={() => setGoalTarget(String(suggestedSavingsGoal.amount))}>
                  <Text style={[styles.suggestionChipLabel, { color: colors.textSecondary }]}>{t('savingsSuggestion')}</Text>
                  <Text style={[styles.suggestionChipAmount, { color: colors.textPrimary }]}>{formatRWF(suggestedSavingsGoal.amount)}</Text>
                  <Text style={[styles.suggestionChipHint, { color: colors.textSecondary }]}>{suggestedSavingsGoal.reasoning}</Text>
                  <Text style={[styles.useSuggestionText, { color: colors.accent }]}>{t('useSuggestion')}</Text>
                </TouchableOpacity>
              )}
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                placeholder={t('targetAmountPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={goalTarget}
                onChangeText={setGoalTarget}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                placeholder={t('goalDurationPlaceholder') || 'Duration in months (optional)'}
                placeholderTextColor={colors.textSecondary}
                value={goalDuration}
                onChangeText={setGoalDuration}
                keyboardType="numeric"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.background }]} onPress={() => setShowAddGoal(false)}>
                  <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleAddGoal}>
                  <Text style={[styles.saveBtnText, { color: colors.black }]}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!editingGoal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setEditingGoal(null);
            setContributionAmount('');
          }}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {editingGoal ? t('addAmountToGoal', { name: editingGoal.name }) : t('addSavingsGoal')}
              </Text>
              {editingGoal && (
                <Text style={[styles.goalAmount, { color: colors.textSecondary }]}>
                  {formatRWF(editingGoal.current as number)} of {formatRWF(editingGoal.target)}
                </Text>
              )}
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary }]}
                placeholder={t('targetAmountPlaceholder')}
                placeholderTextColor={colors.textSecondary}
                value={contributionAmount}
                onChangeText={setContributionAmount}
                keyboardType="numeric"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { backgroundColor: colors.background }]}
                  onPress={() => {
                    setEditingGoal(null);
                    setContributionAmount('');
                  }}>
                  <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleAddContribution}>
                  <Text style={[styles.saveBtnText, { color: colors.black }]}>{t('save')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  addBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 12,
  },
  goalCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalName: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  goalPercent: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  goalAmount: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 4,
    marginBottom: 8,
  },
  goalDuration: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginBottom: 6,
  },
  goalActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  editGoalText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  deleteGoalText: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  categoryName: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  categoryPercent: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  budgetCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  budgetName: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  budgetAmount: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 4,
    marginBottom: 8,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    marginBottom: 20,
  },
  suggestionChip: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  suggestionChipLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    marginBottom: 4,
  },
  suggestionChipAmount: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  suggestionChipHint: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  useSuggestionText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    marginTop: 6,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  suggestedTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    marginBottom: 4,
  },
  suggestedSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginBottom: 16,
  },
  suggestedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  suggestedCategory: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
  },
  suggestedAmount: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  applyBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
  },
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrationCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
  },
  celebrationEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  celebrationSubtitle: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    marginBottom: 24,
    textAlign: 'center',
  },
  celebrationBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  celebrationBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});
