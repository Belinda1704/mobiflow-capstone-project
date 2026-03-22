// Placeholder when business name field is empty / default.
export const DEFAULT_BUSINESS_PLACEHOLDER = 'My Business';

// Statement PDF + credit screen: real business name if set, else display name (not always "My Business").
export function resolveStatementBusinessLabel(businessName: string, displayName: string): string {
  const b = (businessName || '').trim();
  const d = (displayName || '').trim();
  if (b && b !== DEFAULT_BUSINESS_PLACEHOLDER) return b;
  if (d) return d;
  return DEFAULT_BUSINESS_PLACEHOLDER;
}
