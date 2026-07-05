import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initReactI18next } from 'react-i18next';
import i18n from 'i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from '../i18n/locales/en.json';
import am from '../i18n/locales/am.json';
import oro from '../i18n/locales/oro.json';

const LANGUAGE_KEY = 'trustpay-user-language';

const resources = {
  en: { translation: en },
  am: { translation: am },
  oro: { translation: oro }
};

interface LanguageContextType {
  isReady: boolean;
  currentLanguage: string;
  changeLanguage: (lang: 'en' | 'am' | 'oro') => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    async function setupLocalization() {
      try {
        let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
        
        if (!savedLanguage) {
          const systemLocale = Localization.getLocales()[0]?.languageCode;
          savedLanguage = systemLocale === 'am' ? 'am' : 'en';
        }

        if (!i18n.isInitialized) {
          i18n.use(initReactI18next);
          
          await i18n.init({
            resources,
            lng: savedLanguage,
            fallbackLng: 'en',
            compatibilityJSON: 'v4', // ✨ Changed to 'v4' to resolve the type overload conflict
            interpolation: {
              escapeValue: false,
            },
          });
        }
        
        setCurrentLanguage(savedLanguage);
      } catch (error) {
        console.error('Localization bootstrap failure:', error);
      } finally {
        setIsReady(true);
      }
    }

    setupLocalization();
  }, []);

  const changeLanguage = async (lang: 'en' | 'am' | 'oro') => {
    try {
      await i18n.changeLanguage(lang);
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.error('Failed to update language structural context:', error);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080c15' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <LanguageContext.Provider value={{ isReady, currentLanguage, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be wrapped explicitly within a LanguageProvider ecosystem.');
  }
  return context;
}