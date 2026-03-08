/** Map category names to i18n keys for language. */
const CATEGORY_KEY_MAP: Record<string, string> = {
  Sales: 'categorySales',
  Supplies: 'categorySupplies',
  Transport: 'categoryTransport',
  Utilities: 'categoryUtilities',
  Rent: 'categoryRent',
  Salaries: 'categorySalaries',
  Other: 'categoryOther',
};

export function getCategoryTranslationKey(name: string): string | null {
  return CATEGORY_KEY_MAP[name] ?? null;
}

export function translateCategory(name: string, t: (key: string) => string): string {
  const key = getCategoryTranslationKey(name);
  return key ? t(key) : name;
}
