import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function WelcomeScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut, refreshSession } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleRedeem() {
    if (code.length !== 6) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/tokens/redeem', {
        method: 'POST',
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        Alert.alert(t('common.error'), data?.error ?? t('common.error'));
        return;
      }
      Alert.alert(t('welcome.success'));
      await refreshSession();
      if (data?.next === '/create-org') {
        router.replace('/create-org');
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  const gradientHeader = [styles.gradientHeader];

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={gradientHeader}>
        <ThemedView style={styles.languageRow}>
          <LanguageSwitcher />
        </ThemedView>
        <ThemedView style={styles.heroSection}>
          <ThemedView type="primary" style={styles.logoContainer}>
            <ThemedText style={styles.logoText}>N</ThemedText>
          </ThemedView>
          <ThemedText type="subtitle" style={styles.appName}>
            {t('welcome.title')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {t('welcome.subtitle')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.bottomSection}>
        <ThemedView style={styles.featuresList}>
          <ThemedText type="small" style={styles.featureItem}>{t('welcome.feature1')}</ThemedText>
          <ThemedText type="small" style={styles.featureItem}>{t('welcome.feature2')}</ThemedText>
          <ThemedText type="small" style={styles.featureItem}>{t('welcome.feature3')}</ThemedText>
        </ThemedView>

        <TextInput
          value={code}
          onChangeText={(value) => setCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.codeInput,
            { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
          ]}
        />

        <Pressable
          onPress={handleRedeem}
          disabled={code.length !== 6 || submitting}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: theme.primary },
            pressed && { opacity: 0.8 },
            (code.length !== 6 || submitting) && styles.primaryBtnDisabled,
          ]}
        >
          <ThemedText style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
            {submitting ? t('common.loading') : t('welcome.enter')}
          </ThemedText>
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.codeHint}>
          {t('welcome.codeHint')}
        </ThemedText>

        <Pressable onPress={handleSignOut} style={({ pressed }) => pressed && { opacity: 0.7 }}>
          <ThemedText type="small" style={{ color: theme.danger }}>
            {t('nav.signOut')}
          </ThemedText>
        </Pressable>
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
  logoContainer: {
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
  subtitle: { textAlign: 'center', color: '#e2e8f0', marginHorizontal: Spacing.four },
  bottomSection: {
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    alignItems: 'center',
  },
  featuresList: { width: '100%', maxWidth: 400, gap: Spacing.two, marginBottom: Spacing.one },
  featureItem: { paddingLeft: Spacing.two },
  codeInput: {
    width: '100%',
    maxWidth: 400,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 28,
    letterSpacing: 8,
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    maxWidth: 400,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 17, fontWeight: '600' },
  codeHint: { textAlign: 'center', maxWidth: 320 },
});
