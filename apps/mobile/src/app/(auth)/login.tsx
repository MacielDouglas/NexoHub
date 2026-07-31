import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { authClient } from "@/lib/auth-client";
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setIsSigningIn(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });

      if (result?.error) {
        console.error("Erro ao iniciar login com Google:", result.error);
        setErrorMessage(t("login.signInError"));
        setIsSigningIn(false);
        return;
      }

      await refreshSession();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Erro ao iniciar login com Google:", error);
      setErrorMessage(t("login.signInError"));
      setIsSigningIn(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.gradientHeader}>
        <ThemedView style={styles.languageRow}>
          <LanguageSwitcher />
        </ThemedView>

        <ThemedView style={styles.heroSection}>
          <ThemedView style={styles.logoContainer}>
            <ThemedView type="primary" style={styles.logoPlaceholder}>
              <ThemedText style={styles.logoText}>N</ThemedText>
            </ThemedView>
          </ThemedView>

          <ThemedText type="title" style={styles.appName}>
            Nexohub
          </ThemedText>

          <ThemedText
            type="subtitle"
            themeColor="textSecondary"
            style={styles.subtitle}
          >
            {t("common.appTagline")}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.bottomSection}>
        {errorMessage ? (
          <ThemedText type="small" style={[styles.errorText, { color: theme.danger }]}>
            {errorMessage}
          </ThemedText>
        ) : null}

        <Pressable
          disabled={isSigningIn}
          onPress={handleGoogleSignIn}
          style={({ pressed }) => [
            styles.googleButton,
            { backgroundColor: theme.primary },
            (pressed || isSigningIn) && styles.googleButtonPressed,
            isSigningIn && styles.googleButtonDisabled,
          ]}
        >
          <ThemedText
            style={[styles.googleButtonText, { color: theme.primaryForeground }]}
          >
            {isSigningIn ? t("login.signingIn") : t("login.signInWithGoogle")}
          </ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.termsText}>
          {t("login.terms")}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientHeader: {
    flex: 1,
    backgroundColor: "#7C3AED",
    paddingTop: Spacing.five,
    justifyContent: "space-between",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },
  languageRow: {
    alignItems: "center",
    alignSelf: "center",
    marginTop: Spacing.three,
  },
  heroSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  logoContainer: { marginBottom: Spacing.three },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: { fontSize: 36, fontWeight: "700", color: "#ffffff" },
  appName: { textAlign: "center", color: "#ffffff" },
  subtitle: { textAlign: "center", color: "#e2e8f0" },
  bottomSection: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    alignItems: "center",
  },
  googleButton: {
    width: "100%",
    maxWidth: 400,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.two,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  googleButtonPressed: { opacity: 0.8 },
  googleButtonDisabled: { opacity: 0.5 },
  googleButtonText: { fontSize: 17, fontWeight: "600" },
  errorText: { textAlign: "center", maxWidth: 320 },
  termsText: { textAlign: "center", maxWidth: 320 },
});