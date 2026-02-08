import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobiFlowColors, FontFamily } from '../constants/colors';

const PREF_ITEMS: { label: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { label: 'Theme', subtitle: 'Light, Dark, System', icon: 'moon-outline' },
  { label: 'Language', subtitle: 'App display language', icon: 'language-outline' },
];

export default function PreferencesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={MobiFlowColors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {PREF_ITEMS.map((item) => (
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
    justifyContent: 'space-between',
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
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    color: MobiFlowColors.black,
  },
  headerRight: {
    width: 40,
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
    color: MobiFlowColors.black,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.gray,
    marginTop: 2,
  },
});
