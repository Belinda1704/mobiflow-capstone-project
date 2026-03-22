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

/** Built-in categories (user can’t delete). No preset “Sales” — users choose their own labels via custom categories. */
export const DEFAULT_SME_CATEGORIES: DefaultCategoryConfig[] = [
  { name: 'Supplies', color: MobiFlowColors.primary, icon: 'cart-outline' },
  { name: 'Transport', color: MobiFlowColors.accent, icon: 'car-outline' },
  { name: 'Utilities', color: MobiFlowColors.link, icon: 'flash-outline' },
  { name: 'Rent', color: '#0D9488', icon: 'home-outline' },
  { name: 'Salaries', color: '#8B5CF6', icon: 'people-outline' },
  { name: 'Other', color: MobiFlowColors.gray, icon: 'ellipse-outline' },
];

export const DEFAULT_CATEGORY_NAMES = DEFAULT_SME_CATEGORIES.map((c) => c.name);
