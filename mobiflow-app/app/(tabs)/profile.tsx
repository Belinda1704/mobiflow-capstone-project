import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TabHeader } from '../../components/TabHeader';
import { useSignOut } from '../../hooks/useSignOut';
import { MobiFlowColors, FontFamily } from '../../constants/colors';

const MENU_ITEMS: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; route?: string }[] = [
  { label: 'Manage profile', icon: 'person-outline' },
  { label: 'Security', icon: 'shield-checkmark-outline' },
  { label: 'Preferences', icon: 'options-outline', route: '/preferences' },
  { label: 'Notifications', icon: 'notifications-outline' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, loading } = useSignOut();

  async function handleSignOut() {
    const success = await signOut();
    if (success) router.replace('/login');
  }

  return (
    <View style={styles.container}>
      <TabHeader title="Profile" />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>BL</Text>
          </View>
          <TouchableOpacity style={styles.avatarEditBtn} activeOpacity={0.8}>
            <Ionicons name="camera" size={14} color={MobiFlowColors.black} />
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Belinda Larose</Text>
          <Text style={styles.profileEmail}>belinda@example.com</Text>
        </View>
        </View>
        <View style={styles.menuSection}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.menuRow}
            activeOpacity={0.7}
            onPress={() => item.route && router.push(item.route as any)}>
            <View style={styles.menuLeft}>
              <View style={styles.menuIconWrap}>
                <Ionicons name={item.icon} size={20} color={MobiFlowColors.primary} />
              </View>
              <Text style={styles.menuText}>{item.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MobiFlowColors.textSecondary} />
          </TouchableOpacity>
        ))}
        </View>
        <View style={styles.accountActions}>
        <TouchableOpacity style={styles.signOut} onPress={handleSignOut} disabled={loading}>
          <Text style={styles.signOutText}>{loading ? 'Signing out...' : 'Sign out'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAccount} onPress={() => {}}>
          <Text style={styles.deleteAccountText}>Delete account</Text>
        </TouchableOpacity>
        </View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MobiFlowColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  bottomSpacer: {
    height: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 20,
    padding: 20,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
    marginBottom: 20,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: MobiFlowColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: MobiFlowColors.surface,
    borderWidth: 2,
    borderColor: MobiFlowColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: MobiFlowColors.black,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textPrimary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
  },
  menuSection: {
    marginHorizontal: 24,
    backgroundColor: MobiFlowColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: MobiFlowColors.border,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: MobiFlowColors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: MobiFlowColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    fontSize: 15,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  accountActions: {
    marginHorizontal: 24,
    marginTop: 24,
  },
  signOut: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: '#EF4444',
  },
  deleteAccount: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.textSecondary,
  },
});
