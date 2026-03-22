import { useCallback } from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { FontFamily } from '../constants/colors';
import { useThemeColors } from '../contexts/ThemeContext';

type InlineLessonPlayerProps = {
  videoId: string;
  onCompleted?: () => void | Promise<void>;
};

export function InlineLessonPlayer({ videoId, onCompleted }: InlineLessonPlayerProps) {
  const { colors } = useThemeColors();
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const handleOpenVideo = useCallback(async () => {
    await Linking.openURL(videoUrl);
    if (onCompleted) {
      Promise.resolve(onCompleted()).catch((err) => console.warn('Failed to complete lesson:', err));
    }
  }, [onCompleted, videoUrl]);

  return (
    <View style={styles.inlinePlayerWrap}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Open lesson video</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          On web, this lesson opens directly in YouTube.
        </Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={handleOpenVideo}>
          <Text style={[styles.buttonText, { color: colors.onAccent }]}>Open video</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inlinePlayerWrap: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: FontFamily.regular,
  },
  button: {
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 2,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
  },
});
