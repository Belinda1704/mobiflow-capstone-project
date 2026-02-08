import { MobiFlowColors } from './colors';

export type CategoryIcon =
  | 'home-outline'
  | 'car-outline'
  | 'restaurant-outline'
  | 'flash-outline'
  | 'ellipse-outline'
  | 'briefcase-outline'
  | 'cart-outline'
  | 'people-outline';

export type DefaultCategoryConfig = {
  name: string;
  color: string;
  icon: CategoryIcon;
};

/** Light pastel colors for pie/donut chart segments (soft, distinct) */
export const CHART_CATEGORY_COLORS = [
  '#FDE68A', // Supplies - light amber
  '#BBF7D0', // Transport - light green
  '#A5F3FC', // Utilities - light cyan
  '#C4B5FD', // Rent - light purple
  '#FECACA', // Salaries - light rose
  '#E2E8F0', // Other - light gray
];

/** SME-oriented default categories (FR-04) - cannot be deleted by user */
export const DEFAULT_SME_CATEGORIES: DefaultCategoryConfig[] = [
  { name: 'Supplies', color: MobiFlowColors.primary, icon: 'cart-outline' },
  { name: 'Transport', color: MobiFlowColors.accent, icon: 'car-outline' },
  { name: 'Utilities', color: MobiFlowColors.link, icon: 'flash-outline' },
  { name: 'Rent', color: '#0D9488', icon: 'home-outline' },
  { name: 'Salaries', color: '#8B5CF6', icon: 'people-outline' },
  { name: 'Other', color: MobiFlowColors.gray, icon: 'ellipse-outline' },
];

export const DEFAULT_CATEGORY_NAMES = DEFAULT_SME_CATEGORIES.map((c) => c.name);
