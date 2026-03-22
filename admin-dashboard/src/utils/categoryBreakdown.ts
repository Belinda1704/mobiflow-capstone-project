// Merge "Other" and "Others" into one bucket so the chart is not duplicated.
const OTHER_ALIASES = new Set(['other', 'others']);

function normalizeCategoryKey(label: string): string {
  const t = label.trim().toLowerCase();
  if (OTHER_ALIASES.has(t)) return '__other__';
  return t;
}

export type CategoryBucket = { label: string; value: number };

// Single label used after merging other/others from the API.
const MERGED_OTHER_LABEL = 'Other';

// Name for the "rest" bucket so it is not confused with the merged "Other" row from the API.
export const SMALLER_CATEGORIES_LABEL = 'Smaller categories';

// Merge duplicate names (case-insensitive) and merge Other/Others into one row.
export function mergeCategoryBreakdown(items: CategoryBucket[]): CategoryBucket[] {
  if (!items.length) return [];

  const map = new Map<string, { label: string; value: number }>();

  for (const item of items) {
    const raw = item.label?.trim() || 'Unknown';
    const key = normalizeCategoryKey(raw);
    const displayLabel = key === '__other__' ? MERGED_OTHER_LABEL : raw;
    const prev = map.get(key);
    if (prev) {
      prev.value += item.value;
      if (key !== '__other__' && raw.length > 0) {
        prev.label = displayLabel;
      }
    } else {
      map.set(key, { label: displayLabel, value: item.value });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.value - a.value);
}

// Top N-1 categories, then one row for everything else (label "Smaller categories", not "Other" again).
export function topCategoriesWithOther(items: CategoryBucket[], topN: number): CategoryBucket[] {
  const merged = mergeCategoryBreakdown(items);
  if (merged.length <= topN) return merged;
  const top = merged.slice(0, topN - 1);
  const rest = merged.slice(topN - 1);
  const otherSum = rest.reduce((s, x) => s + x.value, 0);
  if (otherSum <= 0) return top;
  return [...top, { label: SMALLER_CATEGORIES_LABEL, value: otherSum }];
}
