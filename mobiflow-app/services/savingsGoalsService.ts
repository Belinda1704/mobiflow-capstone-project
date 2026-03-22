// Savings goals and category budgets in Firestore.
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '../config/firebase';
import { withTimeout } from '../utils/withTimeout';

// Max wait for each Firestore call (slow networks).
const FS_MS = 28000;

export type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  createdAt: number;
  durationMonths?: number | null;
};

export type CategoryBudget = {
  category: string;
  budget: number;
};

const SETTINGS_COLLECTION = 'userSettings';

async function getSettingsRef(userId: string) {
  return doc(db, SETTINGS_COLLECTION, userId);
}

// Get savings goals (errors propagate — callers must not treat failures as “no goals”).
export async function getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  if (!userId) return [];
  const ref = await getSettingsRef(userId);
  const snap = await withTimeout(getDoc(ref), FS_MS);
  const data = snap.data();
  const list = data?.savingsGoals ?? [];
  return Array.isArray(list) ? list : [];
}

// Add or update goal.
export async function saveSavingsGoal(
  userId: string,
  goal: Omit<SavingsGoal, 'id' | 'createdAt'> | SavingsGoal
): Promise<SavingsGoal> {
  const existing = 'id' in goal ? goal : null;
  const id = existing?.id ?? `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = existing?.createdAt ?? Date.now();
  const maybeDuration = (goal as Partial<SavingsGoal>).durationMonths;
  const durationMonths = maybeDuration !== undefined ? maybeDuration : existing?.durationMonths ?? null;
  const full: SavingsGoal = {
    id,
    name: goal.name.trim(),
    target: Math.max(0, goal.target),
    current: Math.max(0, goal.current ?? 0),
    createdAt,
    durationMonths,
  };
  const goals = await getSavingsGoals(userId);
  const others = goals.filter((g) => g.id !== id);
  const updated = [...others, full];
  const ref = await getSettingsRef(userId);
  await withTimeout(setDoc(ref, { savingsGoals: updated }, { merge: true }), FS_MS);
  return full;
}

// Delete goal.
export async function deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
  const goals = await getSavingsGoals(userId);
  const updated = goals.filter((g) => g.id !== goalId);
  const ref = await getSettingsRef(userId);
  await withTimeout(setDoc(ref, { savingsGoals: updated }, { merge: true }), FS_MS);
}

// Get category budgets.
export async function getCategoryBudgets(userId: string): Promise<CategoryBudget[]> {
  if (!userId) return [];
  const ref = await getSettingsRef(userId);
  const snap = await withTimeout(getDoc(ref), FS_MS);
  const data = snap.data();
  const list = data?.categoryBudgets ?? [];
  return Array.isArray(list) ? list : [];
}

// Save category budget.
export async function saveCategoryBudget(
  userId: string,
  category: string,
  budget: number
): Promise<CategoryBudget> {
  const budgets = await getCategoryBudgets(userId);
  const others = budgets.filter((b) => b.category !== category);
  const updated = [...others, { category: category.trim(), budget: Math.max(0, budget) }];
  const ref = await getSettingsRef(userId);
  await withTimeout(setDoc(ref, { categoryBudgets: updated }, { merge: true }), FS_MS);
  return { category: category.trim(), budget: Math.max(0, budget) };
}
