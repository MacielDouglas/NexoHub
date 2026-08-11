"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { SupportedLanguage } from "./resources";
import { normalizeLanguage, resources } from "./resources";

export const SUPPORTED_LANGUAGES = ["pt", "es"] as const;
export type { SupportedLanguage };

export { normalizeLanguage } from "./resources";

export const LANGUAGE_STORAGE_KEY = "nexohub_language";

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
  resources,
  lng: "pt",
  fallbackLng: "pt",
  supportedLngs: ["pt", "es"],
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
