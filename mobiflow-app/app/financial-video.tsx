import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet } from 'react-native';

import { FinancialVideoPlayer } from '../components/FinancialVideoPlayer';
import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';

export default function FinancialVideoScreen() {
  const { colors } = useThemeColors();
  const params = useLocalSearchParams<{ videoId?: string; title?: string; lessonId?: string }>();

  const videoId = params.videoId ?? '';
  const title = (params.title as string) ?? 'Financial literacy';
  const lessonId = params.lessonId ?? videoId;

  if (!videoId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title={title} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={title} />
      <FinancialVideoPlayer videoId={videoId} lessonId={lessonId} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
