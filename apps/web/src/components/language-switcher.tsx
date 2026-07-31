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
    <div className="relative inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-900">
      {(["pt", "es"] as const).map((lang) => (
        <button
          type="button"
          key={lang}
          onClick={() => handleChange(lang)}
          aria-label={t(`language.${lang}`)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            current === lang
              ? "bg-[#2563EB] text-white"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          <span className="text-xs">{FLAGS[lang]}</span>
          <span>{t(`language.${lang}`)}</span>
        </button>
      ))}
    </div>
  );
}
