// Colours and fonts used everywhere in the app.
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Yellow accent colour from the design. */
export const TabBarYellow = '#F5C518';

export const MobiFlowColors = {
  primary: '#1A1A1A',
  accent: '#F5C518',
  /** Icon color for lists/settings (dark in light mode, light in dark mode for consistency). */
  listIcon: '#1A1A1A',
  tabBarBg: '#1A1A1A',
  black: '#0F172A',
  white: '#FFFFFF',
  gray: '#64748B',
  grayLight: '#94A3B8',
  link: '#F5C518',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceElevated: '#F1F5F9',
  border: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  warningText: '#92400E',
  info: '#3B82F6',
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
  primary: '#F5C518',
  accent: '#F5C518',
  /** Same as textPrimary so list/settings icons are light, not yellow. */
  listIcon: '#F8FAFC',
  tabBarBg: '#0F172A',
  black: '#F8FAFC',
  white: '#0F172A',
  gray: '#94A3B8',
  grayLight: '#64748B',
  link: '#F5C518',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceElevated: '#334155',
  border: '#334155',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
  warningBg: '#78350F',
  warningText: '#FCD34D',
  info: '#60A5FA',
} as const;
