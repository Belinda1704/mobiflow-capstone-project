// Preferences: theme and language.
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { SettingsRow } from '../components/SettingsRow';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useTranslations } from '../hooks/useTranslations';
import { changeAppLanguage } from '../i18n';
import { FontFamily } from '../constants/colors';
import type { ThemeOption, LanguageOption } from '../services/preferencesService';

function getThemeLabels(t: (k: string) => string): Record<ThemeOption, string> {
  return { light: t('light'), dark: t('dark'), system: t('system') };
}
function getLangLabels(t: (k: string) => string): Record<LanguageOption, string> {
  return { en: t('english'), rw: t('kinyarwanda') };
}

export default function PreferencesScreen() {
  const { theme, setTheme, colors } = useThemeColors();
  const { t } = useTranslations();
  const { i18n } = useTranslation();
  const language = (i18n.language === 'rw' ? 'rw' : 'en') as LanguageOption;

  const setLanguage = async (l: LanguageOption) => {
    await changeAppLanguage(l);
  };
  const [showTheme, setShowTheme] = useState(false);
  const [showLang, setShowLang] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('preferences')} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsRow
          icon="moon-outline"
          label={t('theme')}
          subtitle={t('themeSubtitle')}
          value={getThemeLabels(t)[theme]}
          onPress={() => setShowTheme(true)}
          colors={colors}
        />
        <SettingsRow
          icon="language-outline"
          label={t('language')}
          subtitle={t('languageSubtitle')}
          value={getLangLabels(t)[language]}
          onPress={() => setShowLang(true)}
          colors={colors}
        />
      </ScrollView>

      <Modal visible={showTheme} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTheme(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('theme')}</Text>
            {(['light', 'dark', 'system'] as ThemeOption[]).map((opt) => (
              <TouchableOpacity key={opt} style={[styles.option, { borderBottomColor: colors.border }]} onPress={() => { setTheme(opt); setShowTheme(false); }}>
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>{getThemeLabels(t)[opt]}</Text>
                {theme === opt && <Text style={[styles.check, { color: colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showLang} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowLang(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('language')}</Text>
            {(['en', 'rw'] as LanguageOption[]).map((l) => (
              <TouchableOpacity key={l} style={[styles.option, { borderBottomColor: colors.border }]} onPress={() => { setLanguage(l); setShowLang(false); }}>
                <Text style={[styles.optionText, { color: colors.textPrimary }]}>{getLangLabels(t)[l]}</Text>
                {language === l && <Text style={[styles.check, { color: colors.primary }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.regular,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  check: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
  },
});
