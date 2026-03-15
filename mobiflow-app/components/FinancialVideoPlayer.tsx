import { useCallback } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import YoutubeIframe, { PLAYER_STATES } from 'react-native-youtube-iframe';

import { useCurrentUser } from '../hooks/useCurrentUser';
import { markLessonCompleted } from '../services/lessonCompletionService';

type FinancialVideoPlayerProps = {
  videoId: string;
  lessonId: string;
};

export function FinancialVideoPlayer({ videoId, lessonId }: FinancialVideoPlayerProps) {
  const { width } = useWindowDimensions();
  const { userId } = useCurrentUser();

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

  return (
    <View style={styles.playerWrap}>
      <YoutubeIframe
        height={playerHeight}
        videoId={videoId}
        onChangeState={onChangeState}
        webViewProps={{ scrollEnabled: false }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  playerWrap: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
