import { useTranslation } from 'react-i18next';

/** Kontrol bahasa chrome (§8.4); penyimpanan `appLng`. */
export function LocaleSelect() {
  const { i18n, t } = useTranslation('common');
  const value = i18n.language.startsWith('en') ? 'en' : 'id';

  return (
    <label className="flex items-center gap-1.5 text-xs text-neutral-600">
      <span className="sr-only">{t('nav.language')}</span>
      <select
        className="rounded-full border border-neutral-200 bg-white px-2 py-1 font-semibold text-neutral-700"
        value={value}
        aria-label={t('nav.language')}
        onChange={(e) => {
          const lng = e.target.value === 'en' ? 'en' : 'id';
          try {
            localStorage.setItem('appLng', lng);
          } catch {
            /* ignore */
          }
          void i18n.changeLanguage(lng);
        }}
      >
        <option value="id">ID</option>
        <option value="en">EN</option>
      </select>
    </label>
  );
}
