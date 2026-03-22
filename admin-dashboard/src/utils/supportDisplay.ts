// Firestore uses "mobile-app"; show "MobiFlow" in the admin UI
export function formatSupportSource(source: string): string {
  const s = (source || '').trim().toLowerCase();
  if (s === 'mobile-app' || s === 'mobiflow-app') return 'MobiFlow';
  return source?.trim() || 'MobiFlow';
}
