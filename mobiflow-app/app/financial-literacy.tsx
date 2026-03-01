// Financial literacy: Kinyarwanda videos, thumbnails list.
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

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
  const router = useRouter();
  const { colors } = useThemeColors();
  const { t } = useTranslations();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('financialLiteracy')} subtitle={t('financialLiteracySubtitle')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{t('financialLiteracyIntro')}</Text>
        {VIDEOS.map((item) => {
          const thumb = getYoutubeThumbnail(item.url);
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.videoCard, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                const videoId = getVideoId(item.url);
                if (videoId) {
                  router.push({
                    pathname: '/financial-video',
                    params: { videoId, lessonId: item.id, title: item.title },
                  } as any);
                }
              }}
              activeOpacity={0.8}>
              <View style={styles.thumbnailWrap}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.thumbnail} contentFit="cover" />
                ) : (
                  <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.surfaceElevated }]} />
                )}
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={36} color="rgba(255,255,255,0.95)" />
                </View>
              </View>
              <View style={styles.videoBody}>
                <Text style={[styles.videoTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.videoHint, { color: colors.textSecondary }]} numberOfLines={1}>
                  {t('financialLiteracyVideoHint')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
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
    marginBottom: 20,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
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
