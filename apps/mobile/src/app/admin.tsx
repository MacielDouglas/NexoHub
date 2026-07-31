import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type OwnerToken = {
  id: string;
  code: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  usedBy?: { id: string; name: string; email: string } | null;
};

type Org = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  _count: { members: number };
};

export default function AdminScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { signOut, refreshSession } = useAuth();
  const [tokens, setTokens] = useState<OwnerToken[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + Spacing.six,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  const fetchAll = useCallback(async () => {
    const [tokenRes, orgRes] = await Promise.all([
      apiFetch('/api/tokens'),
      apiFetch('/api/admin/orgs'),
    ]);
    if (tokenRes.ok) {
      const data = await tokenRes.json();
      if (data.tokens) setTokens(data.tokens);
    }
    if (orgRes.ok) {
      const data = await orgRes.json();
      if (data.organizations) setOrgs(data.organizations);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [tokenRes, orgRes] = await Promise.all([
        apiFetch('/api/tokens'),
        apiFetch('/api/admin/orgs'),
      ]);
      if (cancelled) return;
      if (tokenRes.ok) {
        const data = await tokenRes.json();
        if (data.tokens) setTokens(data.tokens);
      }
      if (orgRes.ok) {
        const data = await orgRes.json();
        if (data.organizations) setOrgs(data.organizations);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createToken() {
    setCreating(true);
    try {
      const res = await apiFetch('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        Alert.alert(t('common.error'), data?.error ?? t('common.error'));
        return;
      }
      Alert.alert(t('admin.tokenCreated'));
      await fetchAll();
    } finally {
      setCreating(false);
    }
  }

  async function revokeToken(id: string) {
    const res = await apiFetch(`/api/tokens/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      Alert.alert(t('common.error'), data?.error ?? t('common.error'));
      return;
    }
    Alert.alert(t('admin.tokenRevoked'));
    await fetchAll();
  }

  async function enterOrg(id: string) {
    const res = await apiFetch(`/api/admin/orgs/${id}/enter`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      Alert.alert(t('common.error'), data?.error ?? t('common.error'));
      return;
    }
    await refreshSession();
    router.replace('/(tabs)');
  }

  async function deleteOrg(id: string, name: string) {
    Alert.alert(
      t('admin.deleteOrgConfirmTitle'),
      t('admin.deleteOrgConfirmDescription', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const res = await apiFetch(`/api/admin/orgs/${id}`, { method: 'DELETE' });
            if (!res.ok) {
              const data = await res.json().catch(() => null);
              Alert.alert(t('common.error'), data?.error ?? t('common.error'));
              return;
            }
            Alert.alert(t('admin.orgDeleted'));
            await fetchAll();
          },
        },
      ],
    );
  }

  async function copyCode(code: string) {
    await Clipboard.setStringAsync(code);
    Alert.alert(t('admin.codeCopied'));
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="subtitle">{t('admin.title')}</ThemedText>
          <ThemedView style={styles.headerActions}>
            <LanguageSwitcher />
          </ThemedView>
        </ThemedView>

        {loading ? (
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.four }}>
            {t('common.loading')}
          </ThemedText>
        ) : (
          <>
            <ThemedView style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>{t('admin.createTokenTitle')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('admin.createTokenDescription')}
              </ThemedText>
              <Pressable
                onPress={createToken}
                disabled={creating}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: theme.primary },
                  pressed && { opacity: 0.8 },
                  creating && { opacity: 0.5 },
                ]}
              >
                <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                  {creating ? t('common.loading') : t('admin.createToken')}
                </ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>{t('admin.tokensTitle')}</ThemedText>
              {tokens.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">{t('admin.noTokens')}</ThemedText>
              ) : (
                tokens.map((token) => (
                  <ThemedView key={token.id} type="backgroundElement" style={styles.rowCard}>
                    <ThemedView style={{ flex: 1 }}>
                      <ThemedText type="code" style={styles.tokenCode}>{token.code}</ThemedText>
                      <ThemedView style={styles.tokenMeta}>
                        <ThemedView type={tokenBadgeType(token.status)} style={styles.roleBadge}>
                          <ThemedText type="small" style={{ fontWeight: '600' }}>
                            {t(`admin.tokenStatus.${token.status}`)}
                          </ThemedText>
                        </ThemedView>
                        {token.usedBy && (
                          <ThemedText type="small" themeColor="textSecondary">
                            {token.usedBy.name}
                          </ThemedText>
                        )}
                      </ThemedView>
                    </ThemedView>
                    {token.status === 'active' && (
                      <ThemedView style={styles.actionColumn}>
                        <Pressable onPress={() => copyCode(token.code)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                          <ThemedText type="small" style={{ color: theme.primary }}>{t('admin.copyCode')}</ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() =>
                            Alert.alert(
                              t('admin.revokeConfirmTitle'),
                              t('admin.revokeConfirmDescription'),
                              [
                                { text: t('common.cancel'), style: 'cancel' },
                                { text: t('common.delete'), style: 'destructive', onPress: () => revokeToken(token.id) },
                              ],
                            )
                          }
                          style={({ pressed }) => pressed && { opacity: 0.7 }}
                        >
                          <ThemedText type="small" style={{ color: theme.danger }}>{t('common.delete')}</ThemedText>
                        </Pressable>
                      </ThemedView>
                    )}
                  </ThemedView>
                ))
              )}
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>{t('admin.orgsTitle')}</ThemedText>
              {orgs.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">{t('admin.noOrgs')}</ThemedText>
              ) : (
                orgs.map((org) => (
                  <ThemedView key={org.id} type="backgroundElement" style={styles.rowCard}>
                    <ThemedView style={{ flex: 1 }}>
                      <ThemedText type="default" style={{ fontWeight: '600' }}>{org.name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {org.slug} · {t('admin.memberCount', { count: org._count.members })}
                      </ThemedText>
                    </ThemedView>
                    <ThemedView style={styles.actionColumn}>
                      <Pressable onPress={() => enterOrg(org.id)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                        <ThemedText type="small" style={{ color: theme.primary }}>{t('admin.enterOrg')}</ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => deleteOrg(org.id, org.name)}
                        style={({ pressed }) => pressed && { opacity: 0.7 }}
                      >
                        <ThemedText type="small" style={{ color: theme.danger }}>{t('admin.deleteOrg')}</ThemedText>
                      </Pressable>
                    </ThemedView>
                  </ThemedView>
                ))
              )}
            </ThemedView>

            <ThemedView style={styles.section}>
              <Pressable onPress={handleSignOut} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <ThemedText type="small" style={{ color: theme.danger }}>
                  {t('nav.signOut')}
                </ThemedText>
              </Pressable>
            </ThemedView>
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function tokenBadgeType(status: string) {
  if (status === 'active') return 'primary';
  if (status === 'used') return 'secondary';
  return 'backgroundSelected';
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: 'row', justifyContent: 'center' },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.four },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  section: { gap: Spacing.three, marginBottom: Spacing.five },
  sectionTitle: { fontWeight: '700' },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  tokenCode: { fontSize: 20, fontWeight: '700', marginBottom: Spacing.one },
  tokenMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  roleBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  actionColumn: { alignItems: 'flex-end', gap: Spacing.one },
  primaryBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
});
