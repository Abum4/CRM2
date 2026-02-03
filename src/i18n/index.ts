import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './locales/ru.json';
import uz from './locales/uz.json';
import en from './locales/en.json';

const resources = {
  ru: { translation: ru },
  uz: { translation: uz },
  en: { translation: en },
};

const savedLanguage = localStorage.getItem('language') || 'ru';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

export const changeLanguage = (lng: string) => {
  localStorage.setItem('language', lng);
  i18n.changeLanguage(lng);
};

export const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uz', name: "O'zbekcha", flag: '🇺🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export default i18n;
