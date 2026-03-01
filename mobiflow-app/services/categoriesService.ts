// Custom categories in Firestore.
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { CustomCategory } from '../types/category';

const SETTINGS_COLLECTION = 'userSettings';

async function getSettingsRef(userId: string) {
  return doc(db, SETTINGS_COLLECTION, userId);
}

// Get custom categories.
export async function getCustomCategories(userId: string): Promise<CustomCategory[]> {
  if (!userId) return [];
  try {
    const ref = await getSettingsRef(userId);
    // Cache first, then server
    const snap = await getDoc(ref);
    const data = snap.data();
    const list = data?.customCategories ?? [];
    return Array.isArray(list) ? list : [];
  } catch (error: any) {
    // Offline + no cache: []
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn('Offline: No cached categories available');
      return [];
    }
    throw error;
  }
}

// Add custom category.
export async function addCustomCategory(
  userId: string,
  name: string
): Promise<CustomCategory> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name is required');
  const id = `cat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const category: CustomCategory = { id, name: trimmed };
  const ref = await getSettingsRef(userId);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    await updateDoc(ref, {
      customCategories: arrayUnion(category),
    });
  } else {
    await setDoc(ref, { customCategories: [category] });
  }
  return category;
}

// Update custom category.
export async function updateCustomCategory(
  userId: string,
  categoryId: string,
  newName: string
): Promise<void> {
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Category name is required');
  const categories = await getCustomCategories(userId);
  const updated = categories.map((c) =>
    c.id === categoryId ? { ...c, name: trimmed } : c
  );
  const ref = await getSettingsRef(userId);
  await setDoc(ref, { customCategories: updated }, { merge: true });
}

// Delete custom category.
export async function deleteCustomCategory(
  userId: string,
  categoryId: string
): Promise<void> {
  const categories = await getCustomCategories(userId);
  const updated = categories.filter((c) => c.id !== categoryId);
  const ref = await getSettingsRef(userId);
  await setDoc(ref, { customCategories: updated }, { merge: true });
}
