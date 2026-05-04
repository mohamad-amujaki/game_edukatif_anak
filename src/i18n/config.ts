import en from '@/locales/en/common.json';
import id from '@/locales/id/common.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

function initialLng(): string {
  if (typeof window === 'undefined') return 'id';
  try {
    const v = localStorage.getItem('appLng');
    return v === 'en' ? 'en' : 'id';
  } catch {
    return 'id';
  }
}

void i18n.use(initReactI18next).init({
  lng: initialLng(),
  fallbackLng: 'id',
  supportedLngs: ['id', 'en'],
  defaultNS: 'common',
  ns: ['common'],
  resources: {
    id: { common: id },
    en: { common: en },
  },
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
