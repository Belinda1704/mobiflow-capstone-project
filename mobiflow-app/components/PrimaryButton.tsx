import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MobiFlowColors, FontFamily } from '../constants/colors';

type PrimaryButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'dark' | 'light' | 'yellow';
};

export function PrimaryButton({ title, onPress, variant = 'yellow' }: PrimaryButtonProps) {
  const bgColor =
    variant === 'dark' ? MobiFlowColors.tabBarBg : variant === 'light' ? MobiFlowColors.surface : MobiFlowColors.accent;
  return (
    <TouchableOpacity style={[styles.button, { backgroundColor: bgColor }]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.text, { color: variant === 'dark' ? MobiFlowColors.white : MobiFlowColors.black }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: MobiFlowColors.accent,
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
