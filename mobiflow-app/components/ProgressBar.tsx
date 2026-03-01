/**
 * Horizontal progress bar. Used for goals, budgets, etc. Track uses theme; fill uses green/yellow/red.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';

type ProgressBarProps = {
  progress: number; // 0-100
  color?: 'green' | 'yellow' | 'red' | string;
  height?: number;
};

const DEFAULT_COLOR_MAP: Record<string, string> = {
  green: '#22C55E',
  yellow: '#F5C518',
  red: '#EF4444',
};

export function ProgressBar({ progress, color = 'green', height = 8 }: ProgressBarProps) {
  const { colors } = useThemeColors();
  const pct = Math.min(100, Math.max(0, progress));
  const themeColor =
    color === 'green' ? colors.success : color === 'red' ? colors.error : color === 'yellow' ? colors.accent : undefined;
  const fillColor = themeColor ?? DEFAULT_COLOR_MAP[color] ?? color;

  return (
    <View testID="progress-bar" style={[styles.track, { height, backgroundColor: colors.border }]}>
      <View style={[styles.fill, { width: `${pct}%`, backgroundColor: fillColor, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
});
