import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/lib/auth-context";
import i18n, { normalizeLanguage, type SupportedLanguage } from "@/i18n";

const LANGUAGES = ["pt", "es"] as const;

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { setLanguage } = useAuth();
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

  async function handlePress(lang: SupportedLanguage) {
    setCurrent(lang);
    await setLanguage(lang);
  }

  return (
    <ThemedView style={styles.container}>
      {LANGUAGES.map((lang) => {
        const selected = current === lang;
        return (
          <Pressable
            key={lang}
            onPress={() => handlePress(lang)}
            style={({ pressed }) => [
              styles.button,
              selected && { backgroundColor: theme.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <ThemedText
              type="smallBold"
              style={selected ? { color: theme.primaryForeground } : { color: theme.textSecondary }}
            >
              {t(`language.${lang}`)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: Spacing.half,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  button: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
  },
});
