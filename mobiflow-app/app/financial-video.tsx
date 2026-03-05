import { useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import YoutubeIframe, { PLAYER_STATES } from 'react-native-youtube-iframe';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { markLessonCompleted } from '../services/lessonCompletionService';

export default function FinancialVideoScreen() {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const { userId } = useCurrentUser();
  const params = useLocalSearchParams<{ videoId?: string; title?: string; lessonId?: string }>();

  const videoId = params.videoId ?? '';
  const title = (params.title as string) ?? 'Financial literacy';
  const lessonId = params.lessonId ?? videoId;

  const playerHeight = Math.min(width * (9 / 16), 320);

  const onChangeState = useCallback(
    (state: string | number) => {
      const ended =
        state === PLAYER_STATES.ENDED ||
        state === 'ended' ||
        state === 0;

      if (!ended) return;

      if (userId && lessonId) {
        markLessonCompleted(userId, lessonId).catch((err) =>
          console.warn('Failed to mark lesson completed:', err)
        );
      }
    },
    [lessonId, userId]
  );

  if (!videoId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
        <ScreenHeader title={title} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={title} />
      <View style={styles.playerWrap}>
        <YoutubeIframe
          height={playerHeight}
          videoId={videoId}
          onChangeState={onChangeState}
          webViewProps={{ scrollEnabled: false }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerWrap: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
