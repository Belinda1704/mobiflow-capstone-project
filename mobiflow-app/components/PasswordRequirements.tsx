/**
 * Shows password rules (length, uppercase, etc.) and ticks which ones the user's password meets.
 */
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import type { PasswordRequirements } from '../utils/passwordStrength';

type PasswordRequirementsProps = {
  requirements: PasswordRequirements;
};

const ITEMS: { key: keyof PasswordRequirements; labelKey: string }[] = [
  { key: 'minLength', labelKey: 'passwordReqMinLength' },
  { key: 'hasUppercase', labelKey: 'passwordReqUppercase' },
  { key: 'hasLowercase', labelKey: 'passwordReqLowercase' },
  { key: 'hasNumber', labelKey: 'passwordReqNumber' },
  { key: 'hasSpecial', labelKey: 'passwordReqSpecial' },
];

export function PasswordRequirementsDisplay({ requirements }: PasswordRequirementsProps) {
  const { t } = useTranslations();
  const { colors } = useThemeColors();
  return (
    <View style={styles.wrap}>
      {ITEMS.map(({ key, labelKey }) => (
        <View key={key} style={styles.row}>
          <Ionicons
            name={requirements[key] ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={requirements[key] ? colors.success : colors.textSecondary}
            style={styles.icon}
          />
          <Text style={[styles.label, { color: colors.textSecondary }, requirements[key] && { color: colors.success }]}>{t(labelKey)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
  },
});
