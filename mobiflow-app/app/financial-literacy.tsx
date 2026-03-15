// Financial literacy - list of videos, tap to expand and watch
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { InlineLessonPlayer } from '../components/InlineLessonPlayer';
import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { FontFamily } from '../constants/colors';
import { getCompletedLessonIds } from '../services/lessonCompletionService';
import { markLessonCompleted } from '../services/lessonCompletionService';

type VideoItem = {
  id: string;
  title: string;
  url: string;
};

const VIDEOS: VideoItem[] = [
  {
    id: 'credit-score',
    title: "Urashaka Ideni ry' INZU, IMODOKA cg Business | Uko wazamura credit score yawe",
    url: 'https://youtu.be/2lzhvZIHGns',
  },
  {
    id: 'budgeting',
    title: 'Menya gukora budget igufasha kwizigama (household budgeting tips)',
    url: 'https://youtu.be/pHhSGRY2zi4',
  },
  {
    id: 'saving-percentages',
    title: 'Uburyo bwo kwizigama 50% – 20% – 10%',
    url: 'https://youtu.be/m1VbAW_Z2v4',
  },
  {
    id: 'loan-requirements',
    title: "Uko wabona inguzanyo muri bank bitakugoye n'ibyo ugomba kuzuza",
    url: 'https://youtu.be/ZlHElky1KD8',
  },
  {
    id: 'bank-trust',
    title: 'Ibyo banki ziheraho zigirira icyizere abakiriya bazo',
    url: 'https://youtu.be/QWXugF5gdds',
  },
];

// Get YouTube video id from a youtu.be or youtube.com URL so we can embed the player
function getVideoId(url: string): string {
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1]?.split('?')[0] ?? '';
  }
  const m = url.match(/[?&]v=([^&]+)/);
  return m ? m[1] : '';
}

function getYoutubeThumbnail(url: string): string {
  const id = getVideoId(url);
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : '';
}

export default function FinancialLiteracyScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { userId } = useCurrentUser();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [openLessonId, setOpenLessonId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!userId) {
        setCompletedIds([]);
        return;
      }
      let cancelled = false;
      getCompletedLessonIds(userId)
        .then((ids) => {
          if (!cancelled) setCompletedIds(ids);
        })
        .catch(() => {
          if (!cancelled) setCompletedIds([]);
        });
      return () => {
        cancelled = true;
      };
    }, [userId])
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('financialLiteracy')} subtitle={t('financialLiteracySubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{t('financialLiteracyIntro')}</Text>
        <Text style={[styles.countText, { color: colors.textSecondary }]}>
          {t('lessonsCompletedCount', { count: completedIds.length, total: VIDEOS.length })}
        </Text>
        {VIDEOS.map((item) => {
          const thumb = getYoutubeThumbnail(item.url);
          const videoId = getVideoId(item.url);
          const isOpen = openLessonId === item.id;
          return (
            <View
              key={item.id}
              style={[styles.videoCard, { backgroundColor: colors.background, borderColor: colors.border }]}
            >
              {isOpen && videoId ? (
                <InlineLessonPlayer
                  videoId={videoId}
                  onCompleted={() => {
                    if (!userId) return;
                    return markLessonCompleted(userId, item.id)
                      .then(() => getCompletedLessonIds(userId))
                      .then((ids) => setCompletedIds(ids));
                  }}
                />
              ) : null}
              <TouchableOpacity
                style={styles.videoRow}
                onPress={() =>
                  setOpenLessonId((current) => (current === item.id ? null : item.id))
                }
                activeOpacity={0.8}
              >
                <View style={styles.thumbnailWrap}>
                  {thumb ? (
                    <>
                      <Image source={{ uri: thumb }} style={styles.thumbnail} contentFit="cover" />
                      <View style={styles.playOverlay}>
                        <Ionicons name="play" size={36} color="rgba(255,255,255,0.95)" />
                      </View>
                    </>
                  ) : (
                    <View
                      style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceElevated }]}
                    />
                  )}
                </View>
                <View style={styles.videoBody}>
                  <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.videoMeta}>
                    <Text style={[styles.videoHint, { color: colors.textSecondary }]} numberOfLines={1}>
                      {t('financialLiteracyVideoHint')}
                    </Text>
                    {completedIds.includes(item.id) && (
                      <View style={styles.completedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color={colors.listIcon ?? colors.primary}
                        />
                        <Text
                          style={[
                            styles.completedLabel,
                            { color: colors.listIcon ?? colors.primary },
                          ]}
                        >
                          {t('lessonCompleted')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  intro: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    lineHeight: 22,
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    marginBottom: 20,
  },
  videoCard: {
    flexDirection: 'column',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailWrap: {
    width: 160,
    height: 90,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: 0,
  },
  videoMeta: {
    marginTop: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  completedLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
  },
  videoTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    lineHeight: 20,
  },
  videoHint: {
    fontSize: 12,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
});
