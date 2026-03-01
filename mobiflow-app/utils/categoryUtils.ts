import { DEFAULT_SME_CATEGORIES } from '../constants/categories';
import type { CategoryIcon } from '../constants/categories';

const CUSTOM_CATEGORY_COLORS = [
  '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EF4444', '#14B8A6', '#EC4899', '#F97316',
];

/** Get colour and icon for a category; built-in categories use our list, custom ones get a colour from a hash. */
export function getCategoryConfig(name: string): { color: string; icon: CategoryIcon; chartColor?: string } {
  const found = DEFAULT_SME_CATEGORIES.find((c) => c.name === name);
  if (found) {
    return {
      color: found.color,
      icon: found.icon,
      chartColor: found.color,
    };
  }
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const customColor = CUSTOM_CATEGORY_COLORS[hash % CUSTOM_CATEGORY_COLORS.length];
  return {
    color: customColor,
    icon: 'ellipse-outline',
    chartColor: customColor,
  };
}
