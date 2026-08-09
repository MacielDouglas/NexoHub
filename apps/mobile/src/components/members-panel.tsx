import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

type Member = {
  id: string;
  role: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type InviteToken = {
  id: string;
  code: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export function MembersPanel() {
  const theme = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { session, refreshSession, organizationRole } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [tokens, setTokens] = useState<InviteToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const currentRole = organizationRole;
  const isOwner = currentRole === 'owner';
  const isAdmin = currentRole === 'admin';
  const canManage = isOwner || isAdmin;

  const fetchAll = useCallback(async () => {
    const [memberRes, tokenRes] = await Promise.all([
      apiFetch('/api/members'),
      apiFetch('/api/tokens'),
    ]);
    if (memberRes.ok) {
      const data = await memberRes.json();
      if (data.members) setMembers(data.members);
    }
    if (tokenRes.ok) {
      const data = await tokenRes.json();
      if (data.tokens) setTokens(data.tokens);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [memberRes, tokenRes] = await Promise.all([
        apiFetch('/api/members'),
        apiFetch('/api/tokens'),
      ]);
      if (cancelled) return;
      if (memberRes.ok) {
        const data = await memberRes.json();
        if (data.members) setMembers(data.members);
      }
      if (tokenRes.ok) {
        const data = await tokenRes.json();
        if (data.tokens) setTokens(data.tokens);
      }
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateRole(id: string, role: string) {
    const res = await apiFetch(`/api/members/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      Alert.alert(t('common.error'), data?.error ?? t('common.error'));
      return;
    }
    Alert.alert(t('members.roleUpdated'));
    await fetchAll();
  }

  async function removeMember(id: string, name: string) {
    Alert.alert(
      t('members.removeConfirmTitle'),
      t('members.removeConfirmDescription', { name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const res = await apiFetch(`/api/members/${id}`, { method: 'DELETE' });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
              Alert.alert(t('common.error'), data?.error ?? t('common.error'));
              return;
            }
            Alert.alert(t('members.memberRemoved'));
            await fetchAll();
          },
        },
      ],
    );
  }

  async function createToken() {
    setCreating(true);
    try {
      const res = await apiFetch('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({ purpose: 'member' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        Alert.alert(t('common.error'), data?.error ?? t('common.error'));
        return;
      }
      await fetchAll();
    } finally {
      setCreating(false);
    }
  }

  async function copyCode(code: string) {
    await Clipboard.setStringAsync(code);
    Alert.alert(t('members.codeCopied'));
  }

  async function leaveOrg() {
    setLeaving(true);
    try {
      const res = await apiFetch('/api/members/leave', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        Alert.alert(t('common.error'), data?.error ?? t('common.error'));
        return;
      }
      await refreshSession();
      router.replace('/');
    } finally {
      setLeaving(false);
    }
  }

  function confirmLeave() {
    Alert.alert(
      t('members.leaveConfirmTitle'),
      t('members.leaveConfirmDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('members.leaveOrg'), style: 'destructive', onPress: leaveOrg },
      ],
    );
  }

  const activeToken = tokens.find((token) => token.status === 'active');

  return (
    <ThemedView style={styles.container}>
      <Pressable
        onPress={confirmLeave}
        disabled={leaving}
        style={({ pressed }) => [
          styles.leaveBtn,
          { borderColor: theme.danger },
          pressed && { opacity: 0.8 },
          leaving && { opacity: 0.5 },
        ]}
      >
        <ThemedText type="small" style={{ color: theme.danger, fontWeight: '600' }}>
          {leaving ? t('common.loading') : t('members.leaveOrg')}
        </ThemedText>
      </Pressable>

      {loading ? (
        <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.four }}>
          {t('common.loading')}
        </ThemedText>
      ) : (
        <>
          {canManage && (
            <ThemedView style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>{t('members.inviteTitle')}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('members.inviteDescription')}
              </ThemedText>

              {activeToken ? (
                <ThemedView type="backgroundElement" style={styles.inviteCard}>
                  <ThemedView style={{ flex: 1 }}>
                    <ThemedText type="code" style={styles.inviteCode}>{activeToken.code}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('members.tokenHint')}
                    </ThemedText>
                  </ThemedView>
                  <Pressable
                    onPress={() => copyCode(activeToken.code)}
                    style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }]}
                  >
                    <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                      {t('members.copyCode')}
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ) : (
                <Pressable
                  onPress={createToken}
                  disabled={creating}
                  style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }, creating && { opacity: 0.5 }]}
                >
                  <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                    {creating ? t('common.loading') : t('members.createToken')}
                  </ThemedText>
                </Pressable>
              )}
            </ThemedView>
          )}

          <ThemedView style={styles.section}>
            <ThemedText type="default" style={styles.sectionTitle}>{t('members.listTitle')}</ThemedText>
            {members.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">{t('members.noMembers')}</ThemedText>
            ) : (
              members.map((member) => (
                <ThemedView key={member.id} type="backgroundElement" style={styles.memberRow}>
                  <ThemedView style={styles.memberInfo}>
                    {member.user.image ? (
                      <Image source={{ uri: member.user.image }} style={styles.avatar} />
                    ) : (
                      <ThemedView type="backgroundSelected" style={styles.avatar}>
                        <ThemedText type="smallBold">
                          {member.user.name.charAt(0).toUpperCase()}
                        </ThemedText>
                      </ThemedView>
                    )}
                    <ThemedView style={{ flex: 1 }}>
                      <ThemedText type="default" style={{ fontWeight: '600' }}>
                        {member.user.name}
                        {member.userId === session?.user?.id && (
                          <ThemedText type="small" themeColor="textSecondary"> ({t('members.you')})</ThemedText>
                        )}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">{member.user.email}</ThemedText>
                    </ThemedView>
                  </ThemedView>

                  <ThemedView style={styles.memberActions}>
                    <ThemedView type={roleBadgeType(member.role)} style={styles.roleBadge}>
                      <ThemedText type="small" style={{ fontWeight: '600' }}>
                        {t(`members.roles.${member.role}`)}
                      </ThemedText>
                    </ThemedView>
                    {canManage && member.userId !== session?.user?.id && (
                      <ThemedView style={styles.actionRow}>
                        {isOwner && member.role !== 'owner' && (
                          <Pressable onPress={() => updateRole(member.id, 'owner')} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                            <ThemedText type="small" style={{ color: theme.primary }}>{t('members.promoteOwner')}</ThemedText>
                          </Pressable>
                        )}
                        {isOwner && member.role === 'owner' && (
                          <Pressable onPress={() => updateRole(member.id, 'admin')} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                            <ThemedText type="small" style={{ color: theme.primary }}>{t('members.demoteOwner')}</ThemedText>
                          </Pressable>
                        )}
                        {member.role !== 'admin' && member.role !== 'owner' && (
                          <Pressable onPress={() => updateRole(member.id, 'admin')} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                            <ThemedText type="small" style={{ color: theme.primary }}>{t('members.promoteAdmin')}</ThemedText>
                          </Pressable>
                        )}
                        {((isOwner && member.role !== 'owner') || (isAdmin && member.role === 'member')) && (
                          <Pressable onPress={() => removeMember(member.id, member.user.name)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                            <ThemedText type="small" style={{ color: theme.danger }}>{t('members.remove')}</ThemedText>
                          </Pressable>
                        )}
                      </ThemedView>
                    )}
                  </ThemedView>
                </ThemedView>
              ))
            )}
          </ThemedView>
        </>
      )}
    </ThemedView>
  );
}

function roleBadgeType(role: string) {
  if (role === 'owner') return 'primary';
  if (role === 'admin') return 'secondary';
  return 'backgroundSelected';
}

const styles = StyleSheet.create({
  container: { marginTop: Spacing.four },
  leaveBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginBottom: Spacing.four,
  },
  section: { gap: Spacing.three, marginBottom: Spacing.five },
  sectionTitle: { fontWeight: '700' },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  inviteCode: { fontSize: 24, fontWeight: '700', marginBottom: Spacing.one },
  primaryBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  memberInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  memberActions: { alignItems: 'flex-end', gap: Spacing.one },
  roleBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Spacing.two,
  },
  actionRow: { flexDirection: 'row', gap: Spacing.three },
});
