import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';
import { FontFamily } from '../constants/colors';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'dark' | 'light' | 'yellow';
  disabled?: boolean;
  testID?: string;
};

export function PrimaryButton({ title, onPress, variant = 'yellow', disabled = false, testID }: PrimaryButtonProps) {
  const { colors, isDark } = useThemeColors();
  const bgColor = variant === 'dark' ? colors.tabBarBg : variant === 'light' ? colors.surface : colors.accent;
  const textColor =
    variant === 'dark'
      ? isDark
        ? colors.textPrimary
        : colors.white
      : variant === 'light'
        ? colors.textPrimary
        : colors.onAccent;
  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: bgColor, opacity: disabled ? 0.5 : 1 }]} 
      onPress={onPress} 
      activeOpacity={0.8}
      disabled={disabled}
      testID={testID}>
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});
