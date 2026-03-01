// Security: how login and data are protected.
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { ScreenHeader } from '../components/ScreenHeader';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';

export default function SecurityScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('security')} subtitle={t('protectYourApp')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          I use Firebase Authentication and Firestore to store my data in the cloud. To keep the account safe, I rely on
          a strong password and the phone’s own lock screen.
        </Text>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Account security</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Sign in with phone number and password. I recommend a password that is not easy to guess.
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Device security</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            The app follows the phone’s lock screen. If the phone is locked, other people cannot easily open MobiFlow.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  paragraph: { fontSize: 14, fontFamily: FontFamily.regular, lineHeight: 22, marginBottom: 20 },
  card: { padding: 20, borderRadius: 12, borderWidth: 1, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontFamily: FontFamily.semiBold },
  cardSubtitle: { fontSize: 13, fontFamily: FontFamily.regular, marginTop: 4 },
});
