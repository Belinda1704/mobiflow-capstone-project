import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import { MobiFlowColors, FontFamily } from '../constants/colors';

type GoogleAuthButtonProps = {
  title: string;
};

export function GoogleAuthButton({ title }: GoogleAuthButtonProps) {
  return (
    <TouchableOpacity style={styles.button}>
      <Image
        source={require('../assets/icons/google icon.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MobiFlowColors.white,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 14,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  text: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.black,
  },
});
