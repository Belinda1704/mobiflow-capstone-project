import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { FontFamily } from '../constants/colors';
import { useThemeColors } from '../contexts/ThemeContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { markLessonCompleted } from '../services/lessonCompletionService';

export default function FinancialVideoWebScreen() {
  const { colors } = useThemeColors();
  const { userId } = useCurrentUser();
  const params = useLocalSearchParams<{ videoId?: string; title?: string; lessonId?: string }>();

  const videoId = params.videoId ?? '';
  const title = (params.title as string) ?? 'Financial literacy';
  const lessonId = params.lessonId ?? videoId;
  const videoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;

  const handleOpenVideo = useCallback(async () => {
    if (!videoUrl) return;

    await Linking.openURL(videoUrl);

    if (userId && lessonId) {
      markLessonCompleted(userId, lessonId).catch((err) =>
        console.warn('Failed to mark lesson completed:', err)
      );
    }
  }, [lessonId, userId, videoUrl]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={title} />
      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Video lessons open in the browser on web.
          </Text>

          {videoUrl ? (
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleOpenVideo}>
              <Text style={[styles.buttonText, { color: colors.onAccent }]}>Open video</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.note, { color: colors.textSecondary }]}>No video was provided for this lesson.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 560,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
  },
});
