"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import i18n, {
  LANGUAGE_STORAGE_KEY,
  normalizeLanguage,
  type SupportedLanguage,
} from "@/i18n";

const FLAGS: Record<string, string> = {
  pt: "🇧🇷",
  es: "🇪🇸",
};

async function updateServerLanguage(language: string) {
  try {
    await fetch("/api/user/language", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language }),
    });
  } catch {
    // ignore network errors; local preference still applies
  }
}

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<SupportedLanguage>(() =>
    normalizeLanguage(i18n.resolvedLanguage),
  );
  const i18nRef = useRef(i18n);

  useEffect(() => {
    const inst = i18nRef.current;
    const sync = () => setCurrent(normalizeLanguage(inst.resolvedLanguage));
    sync();
    inst.on("languageChanged", sync);
    inst.on("initialized", sync);
    return () => {
      inst.off("languageChanged", sync);
      inst.off("initialized", sync);
    };
  }, []);

  function handleChange(lang: string) {
    setCurrent(normalizeLanguage(lang));
    i18n.changeLanguage(lang);
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // ignore storage access errors
    }
    updateServerLanguage(lang);
  }

  return (
    <div className="relative inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {(["pt", "es"] as const).map((lang) => (
        <button
          type="button"
          key={lang}
          onClick={() => handleChange(lang)}
          aria-label={t(`language.${lang}`)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            current === lang
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="text-xs">{FLAGS[lang]}</span>
          <span>{t(`language.${lang}`)}</span>
        </button>
      ))}
    </div>
  );
}
