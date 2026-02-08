import { DEFAULT_SME_CATEGORIES, CHART_CATEGORY_COLORS } from '../constants/categories';
import { MobiFlowColors } from '../constants/colors';
import type { CategoryIcon } from '../constants/categories';

/** Get color and icon for a category name (defaults or hash-based fallback for custom) */
export function getCategoryConfig(name: string): { color: string; icon: CategoryIcon; chartColor?: string } {
  const found = DEFAULT_SME_CATEGORIES.find((c) => c.name === name);
  if (found) {
    const idx = DEFAULT_SME_CATEGORIES.indexOf(found);
    return {
      color: found.color,
      icon: found.icon,
      chartColor: CHART_CATEGORY_COLORS[idx % CHART_CATEGORY_COLORS.length],
    };
  }
  const colors = [MobiFlowColors.primary, MobiFlowColors.accent, MobiFlowColors.link, '#0D9488', '#8B5CF6'];
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return {
    color: colors[hash % colors.length],
    icon: 'ellipse-outline',
    chartColor: CHART_CATEGORY_COLORS[hash % CHART_CATEGORY_COLORS.length],
  };
}
