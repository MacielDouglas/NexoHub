"use client";

import { useEffect } from "react";

import i18n, {
  detectDeviceLanguage,
  normalizeLanguage,
  type SupportedLanguage,
} from "@/i18n";

export function I18nSync({ lang }: { lang?: string | null }) {
  useEffect(() => {
    let target: SupportedLanguage;
    if (lang) {
      target = normalizeLanguage(lang);
    } else {
      target = detectDeviceLanguage();
    }
    if (target !== normalizeLanguage(i18n.resolvedLanguage)) {
      i18n.changeLanguage(target);
    }
  }, [lang]);

  return null;
}
