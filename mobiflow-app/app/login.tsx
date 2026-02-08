// sign in screen
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useSignIn } from '../hooks/useSignIn';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthInput } from '../components/AuthInput';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { AuthColors, FontFamily } from '../constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { signIn, loading } = useSignIn();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) router.replace('/(tabs)');
    });
    return unsub;
  }, [router]);

  async function handleSignIn() {
    const success = await signIn(email, password);
    if (success) router.replace('/(tabs)');
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
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.title}>Sign in</Text>
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon="lock"
              showEye
              onEyePress={() => setShowPassword(!showPassword)}
              eyeOpen={showPassword}
            />

            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>

            <PrimaryButton title={loading ? 'Signing in...' : 'Sign in'} onPress={handleSignIn} variant="yellow" />

            <View style={styles.orWrap}>
              <View style={styles.line} />
              <Text style={styles.or}>or</Text>
              <View style={styles.line} />
            </View>

            <GoogleAuthButton title="Sign in with Google" />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text style={styles.link}>Create account</Text>
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
    backgroundColor: AuthColors.headerBg,
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgot: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: AuthColors.accent,
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
});
