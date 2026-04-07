import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import uk from './uk.json';

const LANG_KEY = 'uevent_lang';

const savedLang = localStorage.getItem(LANG_KEY) ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      uk: { translation: uk },
    },
    lng: savedLang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANG_KEY, lng);
});

export default i18n;
