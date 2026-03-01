/**
 * Wraps the whole app with: theme (light/dark), transaction list context, offline banner, and the SMS capture manager (no UI, just starts/stops the listener).
 */
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ThemeProvider as AppThemeProvider, useThemeColors } from '../contexts/ThemeContext';
import { TransactionsProvider } from '../contexts/TransactionsContext';
import { SmsCaptureManager } from './SmsCaptureManager';
import { OfflineBanner } from './OfflineBanner';
import { View } from 'react-native';

// So the nav bar colours match our light/dark theme
function NavThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeColors();
  const navTheme = isDark ? DarkTheme : DefaultTheme;
  return <ThemeProvider value={navTheme}>{children}</ThemeProvider>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <NavThemeWrapper>
        <TransactionsProvider>
          <View style={{ flex: 1 }}>
            <OfflineBanner />
            <View style={{ flex: 1 }}>{children}</View>
          </View>
          <SmsCaptureManager />
        </TransactionsProvider>
      </NavThemeWrapper>
    </AppThemeProvider>
  );
}
