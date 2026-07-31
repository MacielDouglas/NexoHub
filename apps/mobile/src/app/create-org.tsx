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

export default function CreateOrgScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut, refreshSession } = useAuth();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/orgs', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        Alert.alert(t('common.error'), data?.error ?? t('common.error'));
        return;
      }
      Alert.alert(t('createOrg.success'));
      await refreshSession();
      router.replace('/(tabs)');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.gradientHeader}>
        <ThemedView style={styles.languageRow}>
          <LanguageSwitcher />
        </ThemedView>
        <ThemedView style={styles.heroSection}>
          <ThemedView type="primary" style={styles.logoContainer}>
            <ThemedText style={styles.logoText}>N</ThemedText>
          </ThemedView>
          <ThemedText type="subtitle" style={styles.appName}>
            {t('createOrg.title')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {t('createOrg.subtitle')}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.bottomSection}>
        <ThemedView style={styles.field}>
          <ThemedText type="small">{t('createOrg.nameLabel')}</ThemedText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('createOrg.namePlaceholder')}
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.nameInput,
              { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
            ]}
          />
        </ThemedView>

        <Pressable
          onPress={handleCreate}
          disabled={!name.trim() || submitting}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: theme.primary },
            pressed && { opacity: 0.8 },
            (!name.trim() || submitting) && styles.primaryBtnDisabled,
          ]}
        >
          <ThemedText style={[styles.primaryBtnText, { color: theme.primaryForeground }]}>
            {submitting ? t('common.loading') : t('createOrg.submit')}
          </ThemedText>
        </Pressable>

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
  field: { width: '100%', maxWidth: 400, gap: Spacing.one },
  nameInput: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
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
});
