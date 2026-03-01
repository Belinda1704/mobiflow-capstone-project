// circular progress gauge for business health score
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useThemeColors } from '../contexts/ThemeContext';
import { FontFamily } from '../constants/colors';

type CircularGaugeProps = {
  value: number; // 0-100
  label?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
};

export function CircularGauge({
  value,
  label = 'Good',
  size = 140,
  strokeWidth = 12,
  color,
}: CircularGaugeProps) {
  const { colors } = useThemeColors();
  const strokeColor = color ?? colors.success;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.value, { fontSize: size * 0.22, color: colors.textPrimary }]}>{Math.round(pct)}</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { fontFamily: FontFamily.bold },
  label: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    marginTop: 4,
  },
});
