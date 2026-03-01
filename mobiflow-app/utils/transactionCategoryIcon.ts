/** Picks an icon and colour for each category so the list looks consistent. */
type IconName = keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;

export type CategoryIconInfo = {
  icon: IconName;
  backgroundColor: string;
  iconColor: string;
};

const CATEGORY_ICON_MAP: Record<string, { icon: IconName; colorIndex: number }> = {
  Supplies: { icon: 'cart-outline', colorIndex: 0 },
  Transport: { icon: 'car-outline', colorIndex: 1 },
  Utilities: { icon: 'flash-outline', colorIndex: 2 },
  Rent: { icon: 'home-outline', colorIndex: 3 },
  Salaries: { icon: 'people-outline', colorIndex: 4 },
  Other: { icon: 'ellipse-outline', colorIndex: 5 },
  Airtime: { icon: 'call-outline', colorIndex: 2 },
  Restaurants: { icon: 'restaurant-outline', colorIndex: 4 },
  Uncategorized: { icon: 'help-circle-outline', colorIndex: 5 },
};

const ICON_COLORS = ['#F5C518', '#22C55E', '#0EA5E9', '#8B5CF6', '#EF4444', '#94A3B8'];

function normalizeCategory(cat: string): string {
  const trimmed = (cat ?? 'Other').trim() || 'Other';
  const normalized = trimmed.toLowerCase();
  if (normalized.includes('airtime') || normalized.includes('bundle')) return 'Airtime';
  if (normalized.includes('restaurant') || normalized.includes('food') || normalized.includes('meal'))
    return 'Restaurants';
  if (normalized === 'uncategorized' || normalized === 'other') return 'Other';
  return mapped(trimmed) ?? trimmed;
}

function mapped(name: string): string | undefined {
  const keys = Object.keys(CATEGORY_ICON_MAP);
  const lower = name.toLowerCase();
  for (const k of keys) {
    if (k.toLowerCase() === lower) return k;
  }
  return undefined;
}

export function getTransactionCategoryIcon(
  category: string,
  type: 'income' | 'expense'
): CategoryIconInfo {
  const norm = normalizeCategory(category);
  const config = CATEGORY_ICON_MAP[norm] ?? { icon: 'ellipse-outline' as IconName, colorIndex: 5 };
  const color = ICON_COLORS[config.colorIndex % ICON_COLORS.length] ?? ICON_COLORS[5];
  const backgroundColor = `${color}26`;
  return {
    icon: config.icon,
    backgroundColor,
    iconColor: color,
  };
}
