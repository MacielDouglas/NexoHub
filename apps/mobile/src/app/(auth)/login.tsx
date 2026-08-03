import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { signInWithGoogleIdToken } from '@/lib/google-sign-in';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { refreshSession } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setIsSigningIn(true);

    try {
      const result = await signInWithGoogleIdToken();

      if (result?.error) {
        console.error('Erro ao autenticar com Google:', result.error);
        setErrorMessage(t('login.signInError'));
        return;
      }

      await refreshSession();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Erro ao autenticar com Google:', error);
      setErrorMessage(
        error instanceof Error ? error.message : t('login.signInError'),
      );
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <LinearGradient
      colors={['#2563EB', '#3B5BDB', '#7C3AED']}
      style={styles.gradient}
    >
      <View style={[styles.glow, styles.glowTop]} pointerEvents="none" />
      <View style={[styles.glow, styles.glowBottom]} pointerEvents="none" />

      <View style={[styles.languageWrap, { top: insets.top + Spacing.three, right: Spacing.four }]}>
        <LanguageSwitcher />
      </View>

      <View style={styles.centerWrap}>
        <View style={styles.card} pointerEvents="box-none">
          <View style={styles.brandWrap}>
            <LinearGradient
              colors={['#2563EB', '#7C3AED']}
              style={styles.logo}
            >
              <ThemedText style={styles.logoText}>N</ThemedText>
            </LinearGradient>
            <ThemedText style={styles.appName}>Nexohub</ThemedText>
            <ThemedText style={styles.tagline}>{t('common.appTagline')}</ThemedText>
          </View>

          {errorMessage ? (
            <ThemedText type="small" style={styles.errorText}>
              {errorMessage}
            </ThemedText>
          ) : null}

          <Pressable
            disabled={isSigningIn}
            onPress={handleGoogleSignIn}
            style={({ pressed }) => [
              styles.googleButton,
              (pressed || isSigningIn) && styles.googleButtonPressed,
              isSigningIn && styles.googleButtonDisabled,
            ]}
          >
            <GoogleGlyph />
            <ThemedText style={styles.googleButtonText}>
              {isSigningIn ? t('login.signingIn') : t('login.signInWithGoogle')}
            </ThemedText>
          </Pressable>

          <ThemedText type="small" style={styles.termsText}>
            {t('login.terms')}
          </ThemedText>
        </View>
      </View>
    </LinearGradient>
  );
}

function GoogleGlyph() {
  return (
    <View style={styles.googleGlyph}>
      <ThemedText style={styles.googleGlyphText}>G</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  glowTop: { top: -80, right: -60 },
  glowBottom: { bottom: -80, left: -60 },
  languageWrap: { position: 'absolute', zIndex: 2 },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
    gap: Spacing.three,
  },
  brandWrap: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 32, fontWeight: '700', color: '#ffffff' },
  appName: { fontSize: 28, fontWeight: '600', color: '#1F2937', letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: '#6B7280' },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    maxWidth: 320,
    alignSelf: 'center',
  },
  googleButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  googleButtonPressed: { opacity: 0.8 },
  googleButtonDisabled: { opacity: 0.6 },
  googleButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  googleGlyph: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleGlyphText: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  termsText: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: Spacing.two },
});