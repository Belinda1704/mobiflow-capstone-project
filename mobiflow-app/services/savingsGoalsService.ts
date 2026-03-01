// Savings goals and category budgets in Firestore.
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { db } from '../config/firebase';

export type SavingsGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  createdAt: number;
};

export type CategoryBudget = {
  category: string;
  budget: number;
};

const SETTINGS_COLLECTION = 'userSettings';

async function getSettingsRef(userId: string) {
  return doc(db, SETTINGS_COLLECTION, userId);
}

// Get savings goals.
export async function getSavingsGoals(userId: string): Promise<SavingsGoal[]> {
  if (!userId) return [];
  try {
    const ref = await getSettingsRef(userId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const list = data?.savingsGoals ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Add or update goal.
export async function saveSavingsGoal(
  userId: string,
  goal: Omit<SavingsGoal, 'id' | 'createdAt'> | SavingsGoal
): Promise<SavingsGoal> {
  const existing = 'id' in goal ? goal : null;
  const id = existing?.id ?? `goal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const createdAt = existing?.createdAt ?? Date.now();
  const full: SavingsGoal = {
    id,
    name: goal.name.trim(),
    target: Math.max(0, goal.target),
    current: Math.max(0, goal.current ?? 0),
    createdAt,
  };
  const goals = await getSavingsGoals(userId);
  const others = goals.filter((g) => g.id !== id);
  const updated = [...others, full];
  const ref = await getSettingsRef(userId);
  await setDoc(ref, { savingsGoals: updated }, { merge: true });
  return full;
}

// Delete goal.
export async function deleteSavingsGoal(userId: string, goalId: string): Promise<void> {
  const goals = await getSavingsGoals(userId);
  const updated = goals.filter((g) => g.id !== goalId);
  const ref = await getSettingsRef(userId);
  await setDoc(ref, { savingsGoals: updated }, { merge: true });
}

// Get category budgets.
export async function getCategoryBudgets(userId: string): Promise<CategoryBudget[]> {
  if (!userId) return [];
  try {
    const ref = await getSettingsRef(userId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const list = data?.categoryBudgets ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
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
  await setDoc(ref, { categoryBudgets: updated }, { merge: true });
  return { category: category.trim(), budget: Math.max(0, budget) };
}
