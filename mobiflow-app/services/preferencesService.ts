// User prefs (theme, language) in AsyncStorage.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveStatementBusinessLabel } from '../utils/statementBusinessLabel';

const KEYS = {
  theme: '@mobiflow/theme',
  language: '@mobiflow/language',
  displayName: '@mobiflow/displayName',
  businessName: '@mobiflow/businessName',
  businessType: '@mobiflow/businessType',
  smsCaptureEnabled: '@mobiflow/smsCaptureEnabled',
  lastAutomatedBackupAt: '@mobiflow/lastAutomatedBackupAt',
  automatedBackupEnabled: '@mobiflow/automatedBackupEnabled',
  lastMonthlyReportMonth: '@mobiflow/lastMonthlyReportMonth',
  automatedMonthlyReportEnabled: '@mobiflow/automatedMonthlyReportEnabled',
} as const;

export type ThemeOption = 'light' | 'dark' | 'system';
export type LanguageOption = 'en' | 'rw';

/** In-memory cache so Credit Readiness resolves the label without repeated AsyncStorage reads. */
let cachedStatementBusinessLabel: string | null = null;

export function invalidateStatementBusinessLabelCache(): void {
  cachedStatementBusinessLabel = null;
}

export async function getTheme(): Promise<ThemeOption> {
  const val = await AsyncStorage.getItem(KEYS.theme);
  if (val === 'light' || val === 'dark' || val === 'system') return val;
  return 'light'; // default to light; user can switch to dark or system in Settings
}

export async function setTheme(theme: ThemeOption): Promise<void> {
  await AsyncStorage.setItem(KEYS.theme, theme);
}

export async function getLanguage(): Promise<LanguageOption> {
  const val = await AsyncStorage.getItem(KEYS.language);
  if (val === 'en' || val === 'rw') return val;
  return 'en';
}

export async function setLanguage(lang: LanguageOption): Promise<void> {
  await AsyncStorage.setItem(KEYS.language, lang);
}

export async function getDisplayName(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.displayName)) ?? '';
}

export async function setDisplayName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.displayName, name.trim());
  invalidateStatementBusinessLabelCache();
}

export async function getBusinessName(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.businessName)) ?? 'My Business';
}

export async function getStatementBusinessLabel(): Promise<string> {
  if (cachedStatementBusinessLabel !== null) {
    return cachedStatementBusinessLabel;
  }
  const [bn, dn] = await Promise.all([getBusinessName(), getDisplayName()]);
  cachedStatementBusinessLabel = resolveStatementBusinessLabel(bn, dn);
  return cachedStatementBusinessLabel;
}

/** Call after login so the first Credit Readiness open resolves the label instantly from cache. */
export async function warmStatementBusinessLabelCache(): Promise<void> {
  await getStatementBusinessLabel();
}

export async function setBusinessName(name: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.businessName, name.trim() || 'My Business');
  invalidateStatementBusinessLabelCache();
}

export type BusinessType = 'retail' | 'services' | 'agriculture' | 'other';

export async function getBusinessType(): Promise<BusinessType> {
  const val = await AsyncStorage.getItem(KEYS.businessType);
  if (val === 'retail' || val === 'services' || val === 'agriculture' || val === 'other') return val;
  return 'other';
}

export async function setBusinessType(type: BusinessType): Promise<void> {
  await AsyncStorage.setItem(KEYS.businessType, type);
}

export async function getSmsCaptureEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.smsCaptureEnabled);
  if (val === null) return true;
  return val === 'true';
}

export async function setSmsCaptureEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.smsCaptureEnabled, enabled ? 'true' : 'false');
}

/** Last backup time (ISO). Per userId so two accounts on one phone do not share the same “last backup”. */
export async function getLastAutomatedBackupAt(userId?: string | null): Promise<string | null> {
  if (userId) {
    const scoped = await AsyncStorage.getItem(`${KEYS.lastAutomatedBackupAt}_${userId}`);
    if (scoped) return scoped;
  }
  return await AsyncStorage.getItem(KEYS.lastAutomatedBackupAt);
}

export async function setLastAutomatedBackupAt(isoString: string, userId?: string | null): Promise<void> {
  if (userId) {
    await AsyncStorage.setItem(`${KEYS.lastAutomatedBackupAt}_${userId}`, isoString);
  }
  await AsyncStorage.setItem(KEYS.lastAutomatedBackupAt, isoString);
}

/** Whether to run cloud backup automatically when app is opened and last backup was > 24h ago. Default true. */
export async function getAutomatedBackupEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.automatedBackupEnabled);
  if (val === 'false') return false;
  return true;
}

export async function setAutomatedBackupEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.automatedBackupEnabled, enabled ? 'true' : 'false');
}

/** YYYY-MM of last auto monthly report (stored in AsyncStorage). */
export async function getLastMonthlyReportMonth(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.lastMonthlyReportMonth);
}

export async function setLastMonthlyReportMonth(monthKey: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.lastMonthlyReportMonth, monthKey);
}

/** Auto-generate monthly report when new month starts. Default false. */
export async function getAutomatedMonthlyReportEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.automatedMonthlyReportEnabled);
  return val === 'true';
}

export async function setAutomatedMonthlyReportEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.automatedMonthlyReportEnabled, enabled ? 'true' : 'false');
}
