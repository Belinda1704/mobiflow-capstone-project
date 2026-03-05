// Shows offline banner, then "Syncing..." for a bit when back online
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { FontFamily } from '../constants/colors';
import { useEffect, useState, useRef } from 'react';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const [showSyncing, setShowSyncing] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (isOffline) {
      wasOfflineRef.current = true;
      setShowSyncing(false);
    } else if (wasOfflineRef.current) {
      setShowSyncing(true);
      wasOfflineRef.current = false;
      const id = setTimeout(() => setShowSyncing(false), 4000);
      return () => clearTimeout(id);
    }
  }, [isOffline]);

  if (isOffline) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.surface }]}>
        <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
        <Text style={[styles.pillText, { color: colors.textSecondary }]} numberOfLines={1}>
          {t('offlineBannerTitle')}
        </Text>
      </View>
    );
  }

  if (showSyncing) {
    return (
      <View style={[styles.pill, { backgroundColor: colors.surface }]}>
        <View style={[styles.dot, styles.dotSyncing, { backgroundColor: colors.success }]} />
        <Text style={[styles.pillText, { color: colors.textSecondary }]}>{t('offlineSyncing')}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    maxWidth: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSyncing: {},
  pillText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    maxWidth: 280,
  },
});
