import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobiFlowColors, FontFamily } from '../constants/colors';

const SETTINGS_ITEMS: { label: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Account', subtitle: 'Change email, password', icon: 'key-outline' },
  { label: 'Privacy', subtitle: 'Data visibility, permissions', icon: 'lock-closed-outline' },
  { label: 'Alerts', subtitle: 'Low balance, expense limits', icon: 'alert-circle-outline' },
  { label: 'Data & storage', subtitle: 'Backup, export', icon: 'cloud-outline' },
  { label: 'Help & support', subtitle: 'FAQs, contact us', icon: 'help-circle-outline' },
  { label: 'About MobiFlow', subtitle: 'Version, terms', icon: 'information-circle-outline' },
];

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={MobiFlowColors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity style={styles.searchBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="search" size={24} color={MobiFlowColors.black} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {SETTINGS_ITEMS.map((item) => (
          <TouchableOpacity key={item.label} style={styles.row} activeOpacity={0.7}>
            <View style={styles.iconWrap}>
              <Ionicons name={item.icon} size={22} color={MobiFlowColors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={MobiFlowColors.gray} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MobiFlowColors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backBtn: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.black,
    textAlign: 'center',
  },
  searchBtn: {
    padding: 8,
    width: 40,
    marginLeft: 24,
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
    borderBottomColor: '#F3F4F6',
    gap: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(12, 74, 110, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
    color: MobiFlowColors.black,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.gray,
    marginTop: 2,
  },
});
