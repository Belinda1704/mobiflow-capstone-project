// reusable settings row - icon, label, subtitle, chevron
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobiFlowColors, FontFamily } from '../constants/colors';
import type { ThemeColors } from '../contexts/ThemeContext';

type SettingsRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  colors?: ThemeColors;
};

export function SettingsRow({ icon, label, subtitle, value, onPress, colors: c }: SettingsRowProps) {
  const colors = c ?? MobiFlowColors;
  const content = (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
        <Ionicons name={icon} size={22} color={colors.listIcon ?? colors.primary} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={[styles.value, { color: colors.textSecondary }]}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity style={[styles.touchable, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.touchable, { borderBottomColor: colors.border }]}>{content}</View>;
}

const styles = StyleSheet.create({
  touchable: {
    borderBottomWidth: 1,
    borderBottomColor: MobiFlowColors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: MobiFlowColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textSecondary,
    marginRight: 4,
  },
});
