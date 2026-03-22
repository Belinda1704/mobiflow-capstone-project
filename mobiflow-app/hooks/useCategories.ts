import { useState, useEffect, useCallback } from 'react';
import {
  getCustomCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  DUPLICATE_CATEGORY_ERROR,
} from '../services/categoriesService';
import { DEFAULT_SME_CATEGORIES, DEFAULT_CATEGORY_NAMES } from '../constants/categories';
import type { CustomCategory } from '../types/category';

export type CategoryItem = { name: string; id?: string; isDefault: boolean };

/** True if `name` conflicts with default names or another custom category (optionally excluding one id when renaming). */
export function isDuplicateCategoryName(
  name: string,
  custom: CustomCategory[],
  excludeId?: string
): boolean {
  const lower = name.trim().toLowerCase();
  if (!lower) return true;
  if (DEFAULT_CATEGORY_NAMES.some((n) => n.toLowerCase() === lower)) return true;
  return custom.some(
    (c) => c.id !== excludeId && c.name.trim().toLowerCase() === lower
  );
}

/** Returns all categories: the built-in ones plus any the user added. */
export function useCategories(userId: string | null, _refreshTrigger?: string | number) {
  const [custom, setCustom] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCustom([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getCustomCategories(userId)
      .then(setCustom)
      .catch(() => setCustom([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const allCategories: CategoryItem[] = [
    ...DEFAULT_SME_CATEGORIES.map((c) => ({ name: c.name, isDefault: true })),
    ...custom.map((c) => ({ name: c.name, id: c.id, isDefault: false })),
  ];

  const addCategory = useCallback(async (name: string): Promise<CustomCategory | 'duplicate' | null> => {
    if (!userId) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const optimistic: CustomCategory = { id: tempId, name: trimmed };

    let added = false;
    setCustom((prev) => {
      if (isDuplicateCategoryName(trimmed, prev)) {
        return prev;
      }
      added = true;
      return [...prev, optimistic];
    });

    if (!added) {
      return 'duplicate';
    }

    try {
      const cat = await addCustomCategory(userId, trimmed);
      setCustom((prev) => prev.map((c) => (c.id === tempId ? cat : c)));
      return cat;
    } catch (e: unknown) {
      setCustom((prev) => prev.filter((c) => c.id !== tempId));
      if (e instanceof Error && e.message === DUPLICATE_CATEGORY_ERROR) {
        return 'duplicate';
      }
      throw e;
    }
  }, [userId]);

  const updateCategory = useCallback(
    async (categoryId: string, newName: string) => {
      if (!userId) return;
      const trimmed = newName.trim();
      if (!trimmed) return;

      let previous: CustomCategory[] | null = null;
      let rejected = false;

      setCustom((prev) => {
        previous = prev;
        if (isDuplicateCategoryName(trimmed, prev, categoryId)) {
          rejected = true;
          return prev;
        }
        return prev.map((c) => (c.id === categoryId ? { ...c, name: trimmed } : c));
      });

      if (rejected || !previous) {
        throw new Error(DUPLICATE_CATEGORY_ERROR);
      }

      try {
        await updateCustomCategory(userId, categoryId, trimmed);
      } catch (e) {
        setCustom(previous);
        throw e;
      }
    },
    [userId]
  );

  const removeCategory = useCallback(async (categoryId: string) => {
    if (!userId) return;
    let snapshot: CustomCategory[] | null = null;
    setCustom((prev) => {
      snapshot = prev;
      return prev.filter((c) => c.id !== categoryId);
    });

    try {
      await deleteCustomCategory(userId, categoryId);
    } catch (e) {
      if (snapshot) setCustom(snapshot);
      throw e;
    }
  }, [userId]);

  return {
    categories: allCategories,
    customCategories: custom,
    loading,
    addCategory,
    updateCategory,
    removeCategory,
  };
}
