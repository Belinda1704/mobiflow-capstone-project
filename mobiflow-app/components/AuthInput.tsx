import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MobiFlowColors, FontFamily } from '../constants/colors';

type AuthInputProps = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: 'mail' | 'lock';
  showEye?: boolean;
  onEyePress?: () => void;
  eyeOpen?: boolean;
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
}: AuthInputProps) {
  const iconName = icon === 'mail' ? 'mail-outline' : 'lock-closed-outline';
  const eyeName = eyeOpen ? 'eye-off-outline' : 'eye-outline';

  return (
    <View style={styles.wrap}>
      <Ionicons name={iconName} size={20} color={MobiFlowColors.gray} style={styles.icon} />
      <TextInput
        style={[styles.input, showEye && styles.inputWithEye]}
        placeholder={placeholder}
        placeholderTextColor={MobiFlowColors.gray}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        accessibilityLabel={placeholder}
      />
      {showEye && (
        <TouchableOpacity
          onPress={onEyePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.eyeButton}
          activeOpacity={0.7}>
          <Ionicons name={eyeName} size={22} color={MobiFlowColors.gray} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
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
    color: MobiFlowColors.black,
    minWidth: 0,
  },
  inputWithEye: {
    paddingRight: 4,
  },
});
