// Theme (light/dark/system) and colours used across the app.
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { getTheme, setTheme as saveTheme } from '../services/preferencesService';
import type { ThemeOption } from '../services/preferencesService';
import { MobiFlowColors } from '../constants/colors';
import { DarkColors } from '../constants/colors';

// String values so both light and dark sets type-check
export type ThemeColors = { [K in keyof typeof MobiFlowColors]: string };

const lightColors: ThemeColors = { ...MobiFlowColors };
const darkColors: ThemeColors = { ...DarkColors };

type ThemeContextType = {
  isDark: boolean;
  colors: ThemeColors;
  theme: ThemeOption;
  setTheme: (t: ThemeOption) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeOption>('light');

  useEffect(() => {
    getTheme().then((t) => {
      setThemeState(t);
    });
  }, []);

  const setTheme = useCallback(async (t: ThemeOption) => {
    await saveTheme(t);
    setThemeState(t);
  }, []);

  const isDark =
    theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <ThemeContext.Provider value={{ isDark, colors, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeColors() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return { isDark: false, colors: lightColors, theme: 'system' as ThemeOption, setTheme: async () => {} };
  }
  return ctx;
}
