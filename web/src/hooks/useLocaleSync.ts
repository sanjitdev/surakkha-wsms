/**
 * useLocaleSync — bridges the existing useLocale hook into i18next.
 *
 * useLocale owns the user-facing locale preference and writes
 * body[data-locale] + localStorage. mountLocaleSync is a render-only
 * subscription: every time useLocale's `locale` changes, push the new
 * value into i18next.changeLanguage so useTranslation consumers see
 * the same language the rest of the app is using.
 *
 * Mounted once in AppShell — never inside a route. Returns nothing.
 */
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from './useLocale';

export function useLocaleSync(): void {
  const { locale } = useLocale();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);
}
