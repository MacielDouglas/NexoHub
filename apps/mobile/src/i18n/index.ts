import { getLocales } from "expo-localization";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./locales/es.json";
import pt from "./locales/pt.json";

export const SUPPORTED_LANGUAGES = ["pt", "es"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(lang: string | null | undefined): SupportedLanguage {
  if (!lang) return "pt";
  const code = lang.toLowerCase().split("-")[0];
  if (code === "es") return "es";
  return "pt";
}

function detectDeviceLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    return normalizeLanguage(locales[0]?.languageCode);
  } catch {
    return "pt";
  }
}

// eslint-disable-next-line import/no-named-as-default-member
i18next.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    es: { translation: es },
  },
  lng: detectDeviceLanguage(),
  fallbackLng: "pt",
  supportedLngs: ["pt", "es"],
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;
