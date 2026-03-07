// Header with back button, title, optional subtitle and right-side slot.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '../constants/colors';
import { useThemeColors } from '../contexts/ThemeContext';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  backgroundColor?: string;
};

export function ScreenHeader({ title, subtitle, rightContent, backgroundColor }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColors();
  const bg = backgroundColor ?? colors.background;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, backgroundColor: bg, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        testID="screen-header-back"
        style={styles.backBtn}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
      </TouchableOpacity>
      <View style={styles.titleWrap}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title.toUpperCase()}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{rightContent ?? <View style={styles.spacer} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  right: {
    minWidth: 40,
  },
  spacer: {
    width: 40,
  },
});
