// screen header with title and settings button
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MobiFlowColors, FontFamily } from '../constants/colors';

type TabHeaderProps = {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
};

export function TabHeader({ title, subtitle, rightContent }: TabHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, minHeight: 100 }]}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.right}>
          {rightContent}
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/settings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="settings-outline" size={22} color={MobiFlowColors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: MobiFlowColors.background,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: MobiFlowColors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MobiFlowColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: MobiFlowColors.textSecondary,
    marginTop: 4,
  },
});
