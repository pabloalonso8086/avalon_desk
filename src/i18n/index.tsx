import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import translations from "./i18n.json";

/** Supported languages, in the project's canonical order: English first, then Spanish. */
export const LANGUAGES = ["en", "es"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "en";

type Translations = typeof translations;
export type I18nElement = keyof Translations;
type ElementKey<E extends I18nElement> = keyof Translations[E]["languages"]["en"];

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const value = useMemo(() => ({ language, setLanguage }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLanguage(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useLanguage must be used inside <I18nProvider>");
  return context;
}

/**
 * Returns a `t(key)` function bound to one element of i18n.json.
 * Falls back to English when a text is missing in the active language.
 */
export function useTranslation<E extends I18nElement>(element: E) {
  const { language } = useLanguage();
  return useCallback(
    (key: ElementKey<E>): string => {
      const languages = translations[element].languages as Record<
        Language,
        Record<string, string> | undefined
      >;
      const k = key as string;
      return languages[language]?.[k] ?? languages[DEFAULT_LANGUAGE]?.[k] ?? k;
    },
    [element, language],
  );
}
