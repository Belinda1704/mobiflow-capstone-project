import { useState, useEffect } from 'react';
import {
  getCustomCategories,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
} from '../services/categoriesService';
import { DEFAULT_SME_CATEGORIES } from '../constants/categories';
import type { CustomCategory } from '../types/category';

export type CategoryItem = { name: string; id?: string; isDefault: boolean };

/** Returns merged list: default SME categories + user's custom categories */
export function useCategories(userId: string | null) {
  const [custom, setCustom] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCustom([]);
      setLoading(false);
      return;
    }
    getCustomCategories(userId)
      .then(setCustom)
      .catch(() => setCustom([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const allCategories: CategoryItem[] = [
    ...DEFAULT_SME_CATEGORIES.map((c) => ({ name: c.name, isDefault: true })),
    ...custom.map((c) => ({ name: c.name, id: c.id, isDefault: false })),
  ];

  const addCategory = async (name: string) => {
    if (!userId) return null;
    const cat = await addCustomCategory(userId, name);
    setCustom((prev) => [...prev, cat]);
    return cat;
  };

  const updateCategory = async (categoryId: string, newName: string) => {
    if (!userId) return;
    await updateCustomCategory(userId, categoryId, newName);
    setCustom((prev) =>
      prev.map((c) => (c.id === categoryId ? { ...c, name: newName } : c))
    );
  };

  const removeCategory = async (categoryId: string) => {
    if (!userId) return;
    await deleteCustomCategory(userId, categoryId);
    setCustom((prev) => prev.filter((c) => c.id !== categoryId));
  };

  return {
    categories: allCategories,
    customCategories: custom,
    loading,
    addCategory,
    updateCategory,
    removeCategory,
  };
}
