// Sets up translations (English and Kinyarwanda) and loads the user’s language.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { getLanguage, setLanguage as saveLanguage } from '../services/preferencesService';
import type { LanguageOption } from '../services/preferencesService';

import en from '../locales/en.json';
import rw from '../locales/rw.json';

const resources = {
  en: { translation: en },
  rw: { translation: rw },
};

// Detect device language and map to en or rw.
function getDeviceLanguage(): LanguageOption {
  const locale = Localization.getLocales()[0]?.languageTag ?? 'en';
  if (locale.startsWith('rw')) return 'rw';
  return 'en';
}

// Load saved language or use device language for first-time users.
export async function initI18n(): Promise<void> {
  const savedLang = await getLanguage();
  const lang = savedLang || getDeviceLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
}

// Switch language and save it (used from the Preferences screen).
export async function changeAppLanguage(lang: LanguageOption): Promise<void> {
  await saveLanguage(lang);
  await i18n.changeLanguage(lang);
}

export default i18n;
