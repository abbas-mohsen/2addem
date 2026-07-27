import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './en.js';
import { ar } from './ar.js';
import { setErrorFallbacks } from '../api/client.js';

/* A deliberately small i18n layer rather than react-i18next: the app needs
   lookup, interpolation and plurals, and Intl.PluralRules already handles the
   hard part (Arabic has six plural categories). This is a few hundred bytes
   against roughly forty kilobytes. */

export const LOCALES = {
  en: { label: 'English', dictionary: en, dir: 'ltr' },
  ar: { label: 'العربية', dictionary: ar, dir: 'rtl' },
};

export const DEFAULT_LOCALE = 'en';
const STORAGE_KEY = 'jc_locale';

const I18nContext = createContext(null);

function readStoredLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && LOCALES[stored]) return stored;
  } catch {
    // Private browsing can throw on storage access; the default is fine.
  }

  const preferred = navigator.languages?.find((lang) => LOCALES[lang.split('-')[0]]);
  return preferred ? preferred.split('-')[0] : DEFAULT_LOCALE;
}

function resolve(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    vars[name] === undefined ? match : String(vars[name])
  );
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(readStoredLocale);

  const dir = LOCALES[locale].dir;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next) => {
    if (!LOCALES[next]) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice is not worth failing over.
    }
  }, []);

  const value = useMemo(() => {
    const dictionary = LOCALES[locale].dictionary;
    const pluralRules = new Intl.PluralRules(locale);

    const t = (key, vars) => {
      // English is the fallback for anything not yet translated, so a missing
      // Arabic string degrades to readable text rather than a raw key.
      const entry = resolve(dictionary, key) ?? resolve(en, key);

      if (entry === undefined) {
        if (import.meta.env.DEV) throw new Error(`Missing translation: ${key}`);
        return key;
      }

      if (typeof entry === 'object') {
        const category = pluralRules.select(Number(vars?.count ?? 0));
        const chosen = entry[category] ?? entry.other ?? entry.one;
        return interpolate(chosen ?? key, vars);
      }

      return interpolate(entry, vars);
    };

    // The axios layer has no hooks, so hand it the translated fallbacks.
    setErrorFallbacks({ generic: t('errors.generic'), network: t('errors.network') });

    return { locale, setLocale, dir, isRtl: dir === 'rtl', t };
  }, [locale, dir, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}

/* Convenience for the common case of only needing the translate function. */
export function useT() {
  return useI18n().t;
}
