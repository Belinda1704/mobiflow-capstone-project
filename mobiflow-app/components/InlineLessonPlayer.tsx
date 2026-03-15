import { useCallback } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import YoutubeIframe, { PLAYER_STATES } from 'react-native-youtube-iframe';

type InlineLessonPlayerProps = {
  videoId: string;
  onCompleted?: () => void | Promise<void>;
};

export function InlineLessonPlayer({ videoId, onCompleted }: InlineLessonPlayerProps) {
  const { width } = useWindowDimensions();
  const playerHeight = Math.min((width - 48) * (9 / 16), 260);

  const handleChangeState = useCallback(
    (state: string | number) => {
      const ended = state === PLAYER_STATES.ENDED || state === 'ended' || state === 0;
      if (!ended || !onCompleted) return;
      Promise.resolve(onCompleted()).catch((err) => console.warn('Failed to complete lesson:', err));
    },
    [onCompleted]
  );

  return (
    <View style={styles.inlinePlayerWrap} collapsable={false}>
      <YoutubeIframe
        height={playerHeight}
        videoId={videoId}
        onChangeState={handleChangeState}
        webViewProps={{ scrollEnabled: false }}
      />
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
});
