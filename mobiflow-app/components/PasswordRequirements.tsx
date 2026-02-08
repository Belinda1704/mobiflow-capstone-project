import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { MobiFlowColors, FontFamily } from '../constants/colors';
import type { PasswordRequirements } from '../utils/passwordStrength';

type PasswordRequirementsProps = {
  requirements: PasswordRequirements;
};

const ITEMS: { key: keyof PasswordRequirements; label: string }[] = [
  { key: 'minLength', label: 'At least 8 characters' },
  { key: 'hasUppercase', label: 'One uppercase letter' },
  { key: 'hasLowercase', label: 'One lowercase letter' },
  { key: 'hasNumber', label: 'One number' },
  { key: 'hasSpecial', label: 'One special character (!@#$%^&*)' },
];

export function PasswordRequirementsDisplay({ requirements }: PasswordRequirementsProps) {
  return (
    <View style={styles.wrap}>
      {ITEMS.map(({ key, label }) => (
        <View key={key} style={styles.row}>
          <Ionicons
            name={requirements[key] ? 'checkmark-circle' : 'ellipse-outline'}
            size={16}
            color={requirements[key] ? '#22C55E' : MobiFlowColors.textSecondary}
            style={styles.icon}
          />
          <Text style={[styles.label, requirements[key] && styles.labelMet]}>{label}</Text>
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
    color: MobiFlowColors.textSecondary,
  },
  labelMet: {
    color: '#22C55E',
  },
});
