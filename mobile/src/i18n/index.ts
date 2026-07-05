import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import am from './locales/am.json';

const LANGUAGE_KEY = 'user-language';

const resources = {
  en: { translation: en },
  am: { translation: am },
};

const initI18n = async () => {
  let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
  
  if (!savedLanguage) {
    const systemLocale = Localization.getLocales()[0]?.languageCode;
    savedLanguage = systemLocale === 'am' ? 'am' : 'en';
  }

  // Bind the plugin to the instance first
  i18n.use(initReactI18next);

  // Initialize with 'v4' compatibility configuration
  await i18n.init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    compatibilityJSON: 'v4', // ✨ Changed to 'v4' to match your i18next type system
    interpolation: {
      escapeValue: false, 
    },
  });
};

initI18n();

export default i18n;