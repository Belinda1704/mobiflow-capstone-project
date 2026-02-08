// create account screen
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useSignUp } from '../hooks/useSignUp';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthInput } from '../components/AuthInput';
import { PasswordRequirementsDisplay } from '../components/PasswordRequirements';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { AuthColors, FontFamily } from '../constants/colors';
import { getPasswordRequirements } from '../utils/passwordStrength';

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const { signUp, loading } = useSignUp();

  async function handleCreateAccount() {
    const ok = await signUp(email, password, confirmPassword);
    if (ok) setSuccess(true);
  }

  if (success) {
    return (
      <View style={styles.container} collapsable={false}>
        <StatusBar style="dark" />
        <View style={[styles.safe, { paddingTop: insets.top + 16 }]}>
          <View style={styles.successCard}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={64} color="#22C55E" />
            </View>
            <Text style={styles.successTitle}>Account created successfully!</Text>
            <Text style={styles.successSub}>You can now start tracking your income and expenses.</Text>
            <PrimaryButton title="Go to app" onPress={() => router.replace('/(tabs)')} variant="yellow" />
            <TouchableOpacity style={styles.backToSignIn} onPress={() => router.replace('/login')}>
              <Text style={styles.backToSignInText}>Sign in with different account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} collapsable={false}>
      <StatusBar style="dark" />
      <View style={[styles.safe, { paddingTop: insets.top + 16 }]}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.greeting}>Hello 👋</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.tagline}>
              Track income and expenses with mobile money
            </Text>

            <AuthInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              icon="mail"
            />
            <AuthInput
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon="lock"
              showEye
              onEyePress={() => setShowPassword(!showPassword)}
              eyeOpen={showPassword}
            />
            <PasswordRequirementsDisplay requirements={getPasswordRequirements(password)} />
            <AuthInput
              placeholder="Verify password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              icon="lock"
              showEye
              onEyePress={() => setShowConfirm(!showConfirm)}
              eyeOpen={showConfirm}
            />

            <PrimaryButton title={loading ? 'Creating account...' : 'Create account'} onPress={handleCreateAccount} variant="yellow" />

            <View style={styles.orWrap}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>

            <GoogleAuthButton title="Sign up with Google" />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuthColors.headerBg,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scroll: {
    paddingTop: 0,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: AuthColors.cardBg,
    borderRadius: 20,
    padding: 24,
    borderWidth: 0,
  },
  greeting: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: AuthColors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
    color: AuthColors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: AuthColors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  orWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: AuthColors.border,
  },
  or: {
    marginHorizontal: 12,
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: AuthColors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: AuthColors.textSecondary,
  },
  link: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: AuthColors.accent,
  },
  successCard: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successIconWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: AuthColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 15,
    fontFamily: FontFamily.regular,
    color: AuthColors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  backToSignIn: {
    marginTop: 16,
    alignItems: 'center',
  },
  backToSignInText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: AuthColors.accent,
  },
});
