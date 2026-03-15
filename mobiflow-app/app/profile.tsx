// Profile – user info, manage profile, settings, sign out, change photo
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ScreenHeader } from '../components/ScreenHeader';
import { useSignOut } from '../hooks/useSignOut';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useProfileDisplay } from '../hooks/usePreferences';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { getDisplayLabelFromAuthId, getInitialsFromAuthId } from '../utils/userUtils';
import { deleteAccount, updateProfilePhoto } from '../services/authService';
import { uploadProfilePhoto } from '../services/profilePhotoService';
import { showError } from '../services/errorPresenter';
import { getFriendlyAuthErrorMessage } from '../utils/authErrorUtils';

const MENU_ITEMS: { labelKey: string; icon: React.ComponentProps<typeof Ionicons>['name']; route?: string }[] = [
  { labelKey: 'manageProfile', icon: 'person-outline', route: '/manage-profile' },
  { labelKey: 'security', icon: 'shield-checkmark-outline', route: '/security' },
  { labelKey: 'preferences', icon: 'options-outline', route: '/preferences' },
  { labelKey: 'notifications', icon: 'notifications-outline', route: '/notifications' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { t } = useTranslations();
  const { user } = useCurrentUser();
  const { signOut, loading } = useSignOut();
  const { displayName, businessName, refresh } = useProfileDisplay();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const authId = user?.email ?? '';
  const displayLabel = getDisplayLabelFromAuthId(authId);
  const initials = getInitialsFromAuthId(authId || '??');
  const photoURL = user?.photoURL ?? null;
  const [updatingPhoto, setUpdatingPhoto] = useState(false);
  const primaryLabel = (displayName && displayName.trim()) || displayLabel;
  const secondaryLabel = businessName && businessName.trim() && businessName !== 'My Business' ? businessName : (authId || t('notSignedIn'));

  async function handleChangePhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showError(t('error') || 'Error', 'Photo library permission is needed to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUpdatingPhoto(true);
    try {
      const url = await uploadProfilePhoto(result.assets[0].uri);
      await updateProfilePhoto(url);
    } catch (e: any) {
      showError(t('error') || 'Error', getFriendlyAuthErrorMessage(e) || 'Failed to update profile picture.');
    } finally {
      setUpdatingPhoto(false);
    }
  }

  async function handleSignOut() {
    const success = await signOut();
    if (success) router.replace('/login');
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              router.replace('/login');
            } catch (e: any) {
              const code = e?.code || '';
              if (code === 'auth/requires-recent-login') {
                showError('Re-authentication required', 'Please sign out and sign in again, then try deleting your account.');
              } else {
                showError('Error', getFriendlyAuthErrorMessage(e) || 'Could not delete account. Please try again or contact support.');
              }
            }
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('profile')} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: isDark ? colors.surfaceElevated : colors.accent }]}>
            {photoURL ? (
              <Image source={{ uri: photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: isDark ? colors.textPrimary : colors.black }]}>{initials}</Text>
            )}
          </View>
          <TouchableOpacity
            style={[styles.avatarEditBtn, { backgroundColor: isDark ? colors.surfaceElevated : colors.accent, borderColor: isDark ? colors.border : colors.accent }]}
            onPress={handleChangePhoto}
            disabled={updatingPhoto}
            activeOpacity={0.8}>
            {updatingPhoto ? (
              <ActivityIndicator size="small" color={isDark ? colors.textPrimary : colors.black} />
            ) : (
              <Ionicons name="camera" size={14} color={isDark ? colors.textPrimary : colors.black} />
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.textPrimary }]}>{primaryLabel}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{secondaryLabel}</Text>
        </View>
        </View>
        <View style={[styles.menuSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.labelKey}
            style={[styles.menuRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => item.route ? router.push(item.route as any) : undefined}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconWrap, { backgroundColor: colors.surfaceElevated }]}>
                <Ionicons name={item.icon} size={20} color={colors.listIcon ?? colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>{t(item.labelKey)}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ))}
        </View>
        <View style={styles.accountActions}>
        <TouchableOpacity style={[styles.signOut, { backgroundColor: colors.accent }]} onPress={handleSignOut} disabled={loading}>
          <Text style={[styles.signOutText, { color: colors.black }]}>{loading ? t('signingOut') : t('signOut')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAccount} onPress={handleDeleteAccount}>
          <Text style={[styles.deleteAccountText, { color: colors.error }]}>{t('deleteAccount')}</Text>
        </TouchableOpacity>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  bottomSpacer: { height: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarWrap: { position: 'relative', marginRight: 16 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 64,
    height: 64,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: FontFamily.bold },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontFamily: FontFamily.semiBold, marginBottom: 4 },
  profileEmail: { fontSize: 14, fontFamily: FontFamily.regular },
  menuSection: {
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: { fontSize: 15, fontFamily: FontFamily.medium },
  accountActions: { marginHorizontal: 24, marginTop: 24 },
  signOut: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
  },
  signOutText: { fontSize: 16, fontFamily: FontFamily.semiBold },
  deleteAccount: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  deleteAccountText: { fontSize: 16, fontFamily: FontFamily.semiBold },
});
