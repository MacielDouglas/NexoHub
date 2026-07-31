import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./locales/es.json";
import pt from "./locales/pt.json";

export const SUPPORTED_LANGUAGES = ["pt", "es"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_STORAGE_KEY = "nexohub_language";

export function normalizeLanguage(
  lang: string | null | undefined,
): SupportedLanguage {
  if (!lang) return "pt";
  const code = lang.toLowerCase().split("-")[0];
  if (code === "es") return "es";
  return "pt";
}

export function detectDeviceLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return "pt";
  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
  } catch {
    // ignore storage access errors
  }
  return normalizeLanguage(window.navigator.language);
}

i18next.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    es: { translation: es },
  },
  lng: "pt",
  fallbackLng: "pt",
  supportedLngs: ["pt", "es"],
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
