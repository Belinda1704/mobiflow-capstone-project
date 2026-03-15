import { useCallback } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FontFamily } from '../constants/colors';
import { useThemeColors } from '../contexts/ThemeContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { markLessonCompleted } from '../services/lessonCompletionService';

type FinancialVideoPlayerProps = {
  videoId: string;
  lessonId: string;
};

export function FinancialVideoPlayer({ videoId, lessonId }: FinancialVideoPlayerProps) {
  const { colors } = useThemeColors();
  const { userId } = useCurrentUser();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const handleOpenVideo = useCallback(async () => {
    await Linking.openURL(videoUrl);

    if (userId && lessonId) {
      markLessonCompleted(userId, lessonId).catch((err) =>
        console.warn('Failed to mark lesson completed:', err)
      );
    }
  }, [lessonId, userId, videoUrl]);

  return (
    <View style={styles.playerWrap}>
      <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Open this lesson in the browser</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Video playback is opened directly from YouTube in the web version.
        </Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleOpenVideo}>
          <Text style={[styles.buttonText, { color: colors.black }]}>Open video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  playerWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    width: '100%',
    maxWidth: 560,
    borderWidth: 1,
    borderRadius: 16,
    padding: 24,
    gap: 12,
    alignSelf: 'center',
  },
  title: {
    fontSize: 22,
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
});
