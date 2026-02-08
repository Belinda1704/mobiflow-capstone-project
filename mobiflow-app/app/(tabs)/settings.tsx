import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { TabHeader } from '../../components/TabHeader';
import { useSignOut } from '../../hooks/useSignOut';
import { MobiFlowColors, FontFamily } from '../../constants/colors';

const SETTINGS_ITEMS: { label: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>['name']; route?: string; action?: 'resetOnboarding' }[] = [
  { label: 'Profile', subtitle: 'Manage profile, security, preferences', icon: 'person-outline', route: '/(tabs)/profile' },
  { label: 'Account', subtitle: 'Change email, password', icon: 'key-outline' },
  { label: 'Privacy', subtitle: 'Data visibility, permissions', icon: 'lock-closed-outline' },
  { label: 'Alerts', subtitle: 'Low balance, expense limits', icon: 'alert-circle-outline' },
  { label: 'Data & storage', subtitle: 'Backup, export', icon: 'cloud-outline' },
  { label: 'Help & support', subtitle: 'FAQs, contact us', icon: 'help-circle-outline' },
  { label: 'About MobiFlow', subtitle: 'Version, terms', icon: 'information-circle-outline' },
  { label: 'Reset onboarding', subtitle: 'Sign out & see onboarding again (for testing)', icon: 'refresh-outline', action: 'resetOnboarding' },
];

export default function SettingsTabScreen() {
  const router = useRouter();
  const { signOut } = useSignOut();

  async function handleResetOnboarding() {
    Alert.alert(
      'Reset onboarding',
      'This will sign you out and show the onboarding screen next time you open the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            await AsyncStorage.removeItem('hasCompletedOnboarding');
            const ok = await signOut();
            if (ok) router.replace('/login');
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <TabHeader title="Settings" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => {
              if (item.action === 'resetOnboarding') handleResetOnboarding();
              else if (item.route) router.push(item.route as any);
            }}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={MobiFlowColors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MobiFlowColors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MobiFlowColors.background,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: MobiFlowColors.border,
    gap: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: MobiFlowColors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.textPrimary,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginTop: 2,
  },
});
