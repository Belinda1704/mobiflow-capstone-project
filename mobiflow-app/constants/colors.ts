// colors and fonts used across the app
export const FontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

/** Yellow accent (accepted design) */
export const TabBarYellow = '#F5C518';

export const MobiFlowColors = {
  primary: '#1A1A1A',
  accent: '#F5C518',
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
} as const;

/** Splash & Onboarding - black bg, bright yellow accent (Figma) */
export const OnboardingColors = {
  background: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  accent: '#F5C518',
  link: '#F5C518',
} as const;

/** Auth (Login/Signup) - light grey bg per Figma, white card, yellow accents */
export const AuthColors = {
  headerBg: '#F3F4F6',
  cardBg: '#FFFFFF',
  accent: '#F5C518',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
} as const;
