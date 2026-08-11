import i18next from "i18next";
import type { SupportedLanguage } from "./resources";
import { normalizeLanguage, resources } from "./resources";

i18next.init({
  resources,
  lng: "pt",
  fallbackLng: "pt",
  supportedLngs: ["pt", "es"],
  load: "languageOnly",
  interpolation: {
    escapeValue: false,
  },
});

export function getServerT(lang: string | null | undefined) {
  return i18next.getFixedT(normalizeLanguage(lang));
}

export { normalizeLanguage };
export type { SupportedLanguage };
