import { View, TextInput, TouchableOpacity, StyleSheet, KeyboardTypeOptions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { FontFamily } from '../constants/colors';

type AuthInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: 'mail' | 'lock' | 'phone';
  showEye?: boolean;
  onEyePress?: () => void;
  eyeOpen?: boolean;
  keyboardType?: KeyboardTypeOptions;
  showCountryPrefix?: boolean;
  testID?: string;
};

export function AuthInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  icon = 'mail',
  showEye = false,
  onEyePress,
  eyeOpen = false,
  keyboardType = 'default',
  showCountryPrefix = false,
  testID,
}: AuthInputProps) {
  const { colors } = useThemeColors();
  const iconName = icon === 'mail' ? 'mail-outline' : icon === 'phone' ? 'call-outline' : 'lock-closed-outline';
  const eyeName = eyeOpen ? 'eye-off-outline' : 'eye-outline';

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
      {!showCountryPrefix && <Ionicons name={iconName} size={20} color={colors.textSecondary} style={styles.icon} />}
      {showCountryPrefix && (
        <View style={[styles.prefixContainer, { borderRightColor: colors.border }]}>
          <Text style={styles.flag}>🇷🇼</Text>
          <Text style={[styles.prefix, { color: colors.textSecondary }]}>+250</Text>
        </View>
      )}
      <TextInput
        style={[styles.input, { color: colors.textPrimary }, showEye && styles.inputWithEye, showCountryPrefix && styles.inputWithPrefix]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        accessibilityLabel={placeholder}
        testID={testID}
      />
      {showEye && (
        <TouchableOpacity
          onPress={onEyePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.eyeButton}
          activeOpacity={0.7}>
          <Ionicons name={eyeName} size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  icon: {
    marginRight: 12,
  },
  prefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    paddingRight: 8,
    borderRightWidth: 1,
  },
  eyeButton: {
    width: 40,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.regular,
    minWidth: 0,
  },
  inputWithEye: {
    paddingRight: 4,
  },
  inputWithPrefix: {
    marginLeft: 0,
  },
  flag: {
    fontSize: 18,
    marginRight: 4,
  },
  prefix: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
  },
});
