// Tab screen header – title, optional right content and subtitle.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '../constants/colors';
import { useThemeColors } from '../contexts/ThemeContext';

type TabHeaderProps = {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
};

export function TabHeader({ title, subtitle, rightContent }: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, minHeight: 100, backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <View style={styles.right}>
          {rightContent ?? null}
        </View>
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
});
