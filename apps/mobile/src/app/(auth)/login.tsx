import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    redirectUri: Platform.select({
      web: 'http://localhost:3000',
      default: undefined,
    }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;

      if (id_token && access_token) {
        authClient
          .signInWithGoogle(id_token, access_token)
          .then((result) => {
            if (result.error) {
              console.error('Erro ao autenticar:', result.error);
            }
          })
          .catch((err) => {
            console.error('Erro ao autenticar:', err);
          })
          .finally(() => {
            setIsSigningIn(false);
          });
      }
    }
  }, [response]);

  async function handleGoogleSignIn() {
    setIsSigningIn(true);
    try {
      await promptAsync();
    } catch (err) {
      console.error('Erro ao abrir Google Sign-In:', err);
    } finally {
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
          <ThemedText type="subtitle" themeColor="textSecondary" style={styles.subtitle}>
            {t('common.appTagline')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.bottomSection}>
        <Pressable
          disabled={!request || isSigningIn}
          onPress={handleGoogleSignIn}
          style={({ pressed }) => [
            styles.googleButton,
            { backgroundColor: theme.primary },
            (pressed || isSigningIn) && styles.googleButtonPressed,
            (!request || isSigningIn) && styles.googleButtonDisabled,
          ]}
        >
          <ThemedText
            style={[styles.googleButtonText, { color: theme.primaryForeground }]}
          >
            {isSigningIn ? t('login.signingIn') : t('login.signInWithGoogle')}
          </ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.termsText}>
          {t('login.terms')}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientHeader: {
    flex: 1,
    backgroundColor: '#7C3AED',
    paddingTop: Spacing.five,
    justifyContent: 'space-between',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  languageRow: {
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: Spacing.three,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  logoContainer: { marginBottom: Spacing.three },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: { fontSize: 36, fontWeight: '700', color: '#ffffff' },
  appName: { textAlign: 'center', color: '#ffffff' },
  subtitle: { textAlign: 'center', color: '#e2e8f0' },
  bottomSection: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    alignItems: 'center',
  },
  googleButton: {
    width: '100%',
    maxWidth: 400,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.two,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  googleButtonPressed: { opacity: 0.8 },
  googleButtonDisabled: { opacity: 0.5 },
  googleButtonText: { fontSize: 17, fontWeight: '600' },
  termsText: { textAlign: 'center', maxWidth: 320 },
});
