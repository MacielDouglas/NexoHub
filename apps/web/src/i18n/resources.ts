import es from "./locales/es.json";
import pt from "./locales/pt.json";

export const resources = {
  pt: { translation: pt },
  es: { translation: es },
} as const;

export const SUPPORTED_LANGUAGES = ["pt", "es"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export function normalizeLanguage(
  lang: string | null | undefined,
): SupportedLanguage {
  if (!lang) return "pt";
  const code = lang.toLowerCase().split("-")[0];
  if (code === "es") return "es";
  return "pt";
}
