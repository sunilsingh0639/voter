import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { LANG_KEY } from '../constants';
import hi from '../locales/hi/translation.json';
import en from '../locales/en/translation.json';

const savedLang = localStorage.getItem(LANG_KEY) || 'hi';

i18n.use(initReactI18next).init({
  resources: { hi: { translation: hi }, en: { translation: en } },
  lng: savedLang,
  fallbackLng: 'hi',
  interpolation: { escapeValue: false },
});

export default i18n;
