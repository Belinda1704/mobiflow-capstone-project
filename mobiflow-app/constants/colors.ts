/**
 * Theme colours — use via `useThemeColors().colors` only (avoid raw hex in screens).
 *
 * - **background** — full-screen root / safe area
 * - **surface** — cards, chips, icon wells, inputs on top of the page
 * - **overlay** — modal / sheet scrim
 * - **success / error / accent** — semantic UI; PDFs/HTML exports may keep fixed hex for print
 */
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Yellow accent colour from the design. */
export const TabBarYellow = '#F5C518';

/** Text / icons on solid accent (yellow) — always dark for contrast. */
export const OnAccent = '#0F172A';

export const MobiFlowColors = {
  primary: '#1A1A1A',
  accent: '#F5C518',
  /** Use on buttons/chips with `accent` background (never use `black` — it inverts in dark theme). */
  onAccent: OnAccent,
  /** Icon color for lists/settings (dark in light mode, light in dark mode for consistency). */
  listIcon: '#1A1A1A',
  tabBarBg: '#1A1A1A',
  black: '#0F172A',
  white: '#FFFFFF',
  gray: '#64748B',
  grayLight: '#94A3B8',
  link: '#F5C518',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  /** @deprecated Prefer `surface` for raised panels; equals `background` on full-screen roots in dark. */
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  warningText: '#92400E',
  info: '#3B82F6',
  /** Modal / bottom-sheet scrim — use instead of hardcoded rgba(0,0,0,…). */
  overlay: 'rgba(0,0,0,0.45)',
} as const;

/** Colours for splash and onboarding (black background, yellow accent). */
export const OnboardingColors = {
  background: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  accent: '#F5C518',
  link: '#F5C518',
} as const;

/** Colours for login and signup screens. */
export const AuthColors = {
  headerBg: '#F3F4F6',
  cardBg: '#FFFFFF',
  accent: '#F5C518',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
} as const;

/** Dark theme colour set. List/settings icons use listIcon (light) so dark mode is consistent, not yellow. */
export const DarkColors = {
  /** Same gold as accent; use `onAccent` for text on yellow buttons, not this. */
  primary: '#C9A227',
  /** Muted gold — less harsh than #F5C518 on dark backgrounds */
  accent: '#C9A227',
  onAccent: OnAccent,
  /** Same as textPrimary so list/settings icons are light, not yellow. */
  listIcon: '#F8FAFC',
  tabBarBg: '#0B1020',
  black: '#F8FAFC',
  white: '#0F172A',
  gray: '#94A3B8',
  grayLight: '#64748B',
  link: '#D4AF37',
  /** Main screen / safe area — deepest layer (no “grey” strip vs cards). */
  background: '#0B1020',
  /** Cards, grouped panels — slightly above `background` (subtle, not slate-grey). */
  surface: '#0F1624',
  /** Legacy alias of `background`; prefer `surface` for raised panels. */
  surfaceElevated: '#0B1020',
  border: '#243044',
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  success: '#4ADE80',
  error: '#F87171',
  warning: '#F59E0B',
  warningBg: '#78350F',
  warningText: '#FCD34D',
  info: '#60A5FA',
  overlay: 'rgba(0,0,0,0.55)',
} as const;
