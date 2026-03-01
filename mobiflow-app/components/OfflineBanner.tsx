/** Shows a small “You’re offline” banner at the top; data will sync when you’re back online. */
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { FontFamily } from '../constants/colors';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name="cloud-offline-outline" size={20} color={colors.textSecondary} style={styles.icon} />
      <View style={styles.textWrap}>
        <Text style={[styles.text, { color: colors.textPrimary }]}>{t('offlineBannerTitle')}</Text>
        <Text style={[styles.subtext, { color: colors.textSecondary }]}>{t('offlineBannerSubtitle')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  icon: {},
  textWrap: { flex: 1 },
  text: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  subtext: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
});
