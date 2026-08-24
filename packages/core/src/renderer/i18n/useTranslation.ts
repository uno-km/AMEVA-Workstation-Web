/**
 * @file useTranslation.ts
 * @system AMEVA OS Desktop Workstation - i18n
 * @location packages/core/src/renderer/i18n/useTranslation.ts
 * @role Global language state and translation hook
 */

import { create } from 'zustand';
import type { SupportedLanguage, TranslationSchema } from './types';
import { ko } from './locales/ko';
import { en } from './locales/en';

const TRANSLATIONS: Record<SupportedLanguage, TranslationSchema> = {
  ko,
  en,
};

interface I18nState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
}

const STORAGE_KEY = 'ameva_language';

const getInitialLanguage = (): SupportedLanguage => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') {
      return saved;
    }
    // Fallback to browser navigator language if available
    if (typeof navigator !== 'undefined' && navigator.language) {
      if (navigator.language.toLowerCase().startsWith('ko')) {
        return 'ko';
      }
    }
  } catch {}
  return 'ko';
};

export const useI18nStore = create<I18nState>((set, get) => ({
  language: getInitialLanguage(),
  setLanguage: (lang: SupportedLanguage) => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      // Dispatch custom event so cross-iframe/static pages can react if needed
      window.dispatchEvent(new CustomEvent('ameva-language-change', { detail: lang }));
    } catch {}
    set({ language: lang });
  },
  toggleLanguage: () => {
    const current = get().language;
    const next: SupportedLanguage = current === 'ko' ? 'en' : 'ko';
    get().setLanguage(next);
  },
}));

/**
 * useTranslation Hook
 * Returns current translation dictionary and helper functions.
 */
export function useTranslation() {
  const language = useI18nStore((state) => state.language);
  const setLanguage = useI18nStore((state) => state.setLanguage);
  const toggleLanguage = useI18nStore((state) => state.toggleLanguage);

  const t = TRANSLATIONS[language] || TRANSLATIONS.ko;

  return {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isKorean: language === 'ko',
    isEnglish: language === 'en',
  };
}

export { type SupportedLanguage, type TranslationSchema } from './types';
