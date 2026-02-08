import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { TabHeader } from '../../components/TabHeader';
import { MobiFlowColors, FontFamily } from '../../constants/colors';

const MORE_ITEMS: { label: string; subtitle: string; icon: React.ComponentProps<typeof Ionicons>['name']; route: string }[] = [
  { label: 'Manage categories', subtitle: 'Add, edit, delete expense categories', icon: 'pricetags-outline', route: '/categories' },
  { label: 'Business health', subtitle: 'Track your business wellness', icon: 'heart-outline', route: '/business-health' },
  { label: 'Savings & budget goals', subtitle: 'Set and track savings targets', icon: 'wallet-outline', route: '/savings-budget-goals' },
  { label: 'Business insights', subtitle: 'Analytics and trends', icon: 'analytics-outline', route: '/business-insights' },
  { label: 'Credit readiness', subtitle: 'Prepare for credit applications', icon: 'card-outline', route: '/credit-readiness' },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TabHeader title="More" />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {MORE_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}>
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
