import * as DocumentPicker from 'expo-document-picker';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemEditor } from '@/components/meeting-content-editors';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  CONTENT_TABS,
  type ContentTabKey,
  emptyItemData,
  formatContentIssue,
  issueKey,
  type LoadedContent,
  type MeetingContent,
  type MeetingContentItem,
} from '@/lib/meeting-content-types';

type FlatContent = MeetingContent & { items: MeetingContentItem[] };

type SongTitle = (num: number | null | undefined) => string | null;

function numberKey(item: MeetingContentItem): number {
  const n = (item.data as { number?: number | null })?.number;
  return typeof n === 'number' ? n : Number.MAX_SAFE_INTEGER;
}

export default function MeetingContentScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { organizationRole } = useAuth();

  const canManage = organizationRole === 'owner' || organizationRole === 'admin';

  const [tab, setTab] = useState<ContentTabKey>('apostila');
  const [contents, setContents] = useState<MeetingContent[]>([]);
  const [flat, setFlat] = useState<FlatContent[]>([]);
  const [selected, setSelected] = useState<LoadedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [songTitles, setSongTitles] = useState<Map<number, string>>(new Map());

  const isFlat = tab === 'discursos' || tab === 'canticos';

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
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

  const fetchContents = useCallback(async () => {
    const res = await apiFetch('/api/meeting-content');
    if (res.ok) {
      const data = await res.json();
      if (data.contents) setContents(data.contents);
    }
  }, []);

  const fetchFlat = useCallback(async (type: ContentTabKey) => {
    const res = await apiFetch(`/api/meeting-content?type=${type}&includeItems=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.contents) setFlat(data.contents);
    }
  }, []);

  const refreshCurrent = useCallback(async () => {
    if (tab === 'discursos' || tab === 'canticos') {
      await fetchFlat(tab);
    } else {
      await fetchContents();
    }
  }, [tab, fetchContents, fetchFlat]);

  const loadSongTitles = useCallback(async () => {
    const res = await apiFetch('/api/meeting-content?type=canticos&includeItems=1');
    if (res.ok) {
      const data = await res.json();
      const map = new Map<number, string>();
      for (const c of (data.contents as FlatContent[]) ?? []) {
        for (const it of c.items ?? []) {
          const d = it.data as { number?: number | null; theme?: string };
          if (typeof d.number === 'number' && d.theme) {
            map.set(d.number, d.theme);
          }
        }
      }
      setSongTitles(map);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      await refreshCurrent();
      await loadSongTitles();
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [refreshCurrent, loadSongTitles]);

  async function openContent(content: MeetingContent) {
    setSelected(null);
    const res = await apiFetch(`/api/meeting-content/${content.id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.content) setSelected(data.content);
    }
  }

  async function handleImport() {
    setUploading(true);
    setUploadError(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];
      if (!asset.name.toLowerCase().endsWith('.jwpub')) {
        setUploadError(t('meetingContent.importError'));
        return;
      }

      const doUpload = (replace: boolean) => {
        const form = new FormData();
        form.append('type', tab);
        if (asset.file) {
          form.append('file', asset.file as unknown as Blob, asset.name);
        } else {
          form.append('file', {
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType ?? 'application/octet-stream',
          } as unknown as Blob);
        }
        if (replace) form.append('replace', 'true');
        return apiFetch('/api/meeting-content/import', {
          method: 'POST',
          body: form,
        });
      };

      const res = await doUpload(false);

      if (res.status === 409) {
        const data = (await res.json().catch(() => null)) as {
          existing?: { title?: string };
        } | null;
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            t('meetingContent.duplicateConfirmTitle'),
            t('meetingContent.duplicateConfirm', {
              title: data?.existing?.title ?? '',
            }),
            [
              { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
              {
                text: t('meetingContent.duplicateConfirmReplace'),
                style: 'destructive',
                onPress: () => resolve(true),
              },
            ],
          );
        });
        if (!confirmed) return;
        const res2 = await doUpload(true);
        if (!res2.ok) {
          setUploadError(t('meetingContent.importError'));
          return;
        }
      } else if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          code?: string;
          error?: string;
        } | null;
        if (data?.code === 'TYPE_MISMATCH') {
          setUploadError(
            t('meetingContent.typeMismatch', {
              type: t(`meetingContent.tabs.${tab}`),
            }),
          );
        } else {
          setUploadError(data?.error ?? t('meetingContent.importError'));
        }
        return;
      }

      setSelected(null);
      await refreshCurrent();
      await loadSongTitles();
      Alert.alert(t('meetingContent.importSuccess'));
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteContent(content: MeetingContent) {
    Alert.alert(
      t('meetingContent.deleteConfirmTitle'),
      t('meetingContent.deleteConfirmDescription'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const res = await apiFetch(`/api/meeting-content/${content.id}`, {
              method: 'DELETE',
            });
            if (res.ok) {
              if (selected?.id === content.id) setSelected(null);
              await refreshCurrent();
              Alert.alert(t('meetingContent.deleteSuccess'));
            } else {
              Alert.alert(t('common.error'), t('meetingContent.importError'));
            }
          },
        },
      ],
    );
  }

  function handleDeleteAll() {
    Alert.alert(
      t('meetingContent.removeAllConfirmTitle'),
      t('meetingContent.removeAllConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const res = await apiFetch(`/api/meeting-content?type=${tab}`, {
              method: 'DELETE',
            });
            if (res.ok) {
              setFlat([]);
              Alert.alert(t('meetingContent.removeAllSuccess'));
            } else {
              Alert.alert(t('common.error'), t('meetingContent.importError'));
            }
          },
        },
      ],
    );
  }

  async function handleCreateEmpty() {
    const res = await apiFetch('/api/meeting-content', {
      method: 'POST',
      body: JSON.stringify({ type: tab, title: '' }),
    });
    if (res.ok) {
      const data = await res.json();
      await refreshCurrent();
      await openContent(data.content);
    }
  }

  async function saveItem(
    item: MeetingContentItem,
    data: Record<string, unknown>,
  ): Promise<boolean> {
    const res = await apiFetch(`/api/meeting-content/items/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ data }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (selected) {
      setSelected((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === item.id ? { ...i, data: json.item.data } : i,
              ),
            }
          : prev,
      );
    } else {
      setFlat((prev) =>
        prev.map((c) =>
          c.id === item.contentId
            ? {
                ...c,
                items: c.items.map((i) =>
                  i.id === item.id ? { ...i, data: json.item.data } : i,
                ),
              }
            : c,
        ),
      );
    }
    return true;
  }

  async function addItem() {
    if (!selected) return;
    const res = await apiFetch(`/api/meeting-content/${selected.id}/items`, {
      method: 'POST',
      body: JSON.stringify({ data: emptyItemData(selected.type) }),
    });
    if (res.ok) {
      const data = await res.json();
      setSelected((prev) =>
        prev ? { ...prev, items: [...prev.items, data.item] } : prev,
      );
    }
  }

  async function deleteItem(item: MeetingContentItem) {
    if (!selected) return;
    const res = await apiFetch(`/api/meeting-content/items/${item.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSelected((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((i) => i.id !== item.id) }
          : prev,
      );
    }
  }

  async function addFlatItem() {
    let target = flat[0];
    if (!target) {
      const res = await apiFetch('/api/meeting-content', {
        method: 'POST',
        body: JSON.stringify({ type: tab, title: '' }),
      });
      if (!res.ok) return;
      const data = await res.json();
      target = { ...data.content, items: [] };
    }
    const res = await apiFetch(`/api/meeting-content/${target.id}/items`, {
      method: 'POST',
      body: JSON.stringify({ data: emptyItemData(tab) }),
    });
    if (res.ok) {
      const data = await res.json();
      setFlat((prev) =>
        prev.map((c) =>
          c.id === target.id ? { ...c, items: [...c.items, data.item] } : c,
        ),
      );
    }
  }

  async function deleteFlatItem(item: MeetingContentItem) {
    const res = await apiFetch(`/api/meeting-content/items/${item.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setFlat((prev) =>
        prev.map((c) =>
          c.id === item.contentId
            ? { ...c, items: c.items.filter((i) => i.id !== item.id) }
            : c,
        ),
      );
    }
  }

  const tabContents = contents
    .filter((c) => c.type === tab)
    .sort((a, b) => issueKey(b) - issueKey(a) || b.createdAt.localeCompare(a.createdAt));
  const flatItems = flat.flatMap((c) => c.items).sort((a, b) => numberKey(a) - numberKey(b));
  const songTitle = (num: number | null | undefined) =>
    num == null ? null : (songTitles.get(num) ?? null);

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>
          {t('meetingContent.title')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {t('meetingContent.subtitle')}
        </ThemedText>

        <ThemedView type="backgroundSelected" style={styles.tabsRow}>
          {CONTENT_TABS.map(({ key, icon }) => {
            const active = tab === key;
            return (
              <Pressable
                key={key}
                onPress={() => {
                  setTab(key);
                  setSelected(null);
                }}
                style={({ pressed }) => [
                  styles.tab,
                  active && { backgroundColor: theme.backgroundElement },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ThemedText
                  type="smallBold"
                  themeColor={active ? 'text' : 'textSecondary'}
                  numberOfLines={1}
                >
                  {icon} {t(`meetingContent.tabs.${key}`)}
                </ThemedText>
              </Pressable>
            );
          })}
        </ThemedView>

        {loading ? (
          <ThemedText themeColor="textSecondary" style={{ textAlign: 'center', marginTop: Spacing.four }}>
            {t('common.loading')}
          </ThemedText>
        ) : isFlat ? (
          <View>
            {canManage && (
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={handleImport}
                  disabled={uploading}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: theme.primary },
                    pressed && { opacity: 0.8 },
                    uploading && { opacity: 0.5 },
                  ]}
                >
                  <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                    {uploading
                      ? t('meetingContent.importing')
                      : t('meetingContent.importFile')}
                  </ThemedText>
                </Pressable>
                {uploadError && (
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {uploadError}
                  </ThemedText>
                )}
              </View>
            )}
            <FlatView
              type={tab}
              items={flatItems}
              canManage={canManage}
              songTitle={songTitle}
              onAdd={addFlatItem}
              onSaveItem={saveItem}
              onDeleteItem={deleteFlatItem}
              onDeleteAll={handleDeleteAll}
            />
          </View>
        ) : selected ? (
          <SelectedView
            content={selected}
            canManage={canManage}
            songTitle={songTitle}
            onBack={() => setSelected(null)}
            onSaveItem={saveItem}
            onAddItem={addItem}
            onDeleteItem={deleteItem}
          />
        ) : (
          <>
            {canManage && (
              <View style={styles.actionsRow}>
                <Pressable
                  onPress={handleImport}
                  disabled={uploading}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    { backgroundColor: theme.primary },
                    pressed && { opacity: 0.8 },
                    uploading && { opacity: 0.5 },
                  ]}
                >
                  <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
                    {uploading ? t('meetingContent.importing') : t('meetingContent.importFile')}
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleCreateEmpty}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    { borderColor: theme.border },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <ThemedText type="smallBold">
                    {t('meetingContent.createEmpty')}
                  </ThemedText>
                </Pressable>
                {uploadError && (
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {uploadError}
                  </ThemedText>
                )}
              </View>
            )}

            {tabContents.length === 0 ? (
              <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                {t('meetingContent.empty')}
              </ThemedText>
            ) : (
              <View style={styles.list}>
                {tabContents.map((content) => (
                  <ContentCard
                    key={content.id}
                    type={tab}
                    content={content}
                    canManage={canManage}
                    onOpen={() => openContent(content)}
                    onDelete={() => handleDeleteContent(content)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function ContentCard({
  type,
  content,
  canManage,
  onOpen,
  onDelete,
}: {
  type: string;
  content: MeetingContent;
  canManage: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const issue = formatContentIssue(type, content);

  return (
    <ThemedView type="backgroundElement" style={styles.contentCard}>
      <View style={styles.contentHeader}>
        <View style={styles.contentInfo}>
          {issue ? (
            <ThemedText type="default" style={[styles.contentIssue, { color: theme.primary }]}>
              {issue}
            </ThemedText>
          ) : null}
          <ThemedText type="default" style={styles.contentTitle} numberOfLines={1}>
            {content.title || t('meetingContent.untitled')}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {[
              type === 'apostila' ? content.coverTitle : null,
              content.symbol,
              t('meetingContent.itemCount', {
                count: content._count?.items ?? 0,
              }),
            ]
              .filter(Boolean)
              .join(' · ')}
          </ThemedText>
        </View>
        <View style={styles.contentActions}>
          <Pressable
            onPress={onOpen}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <ThemedText type="small" style={{ color: theme.primary }}>
              {canManage ? t('common.edit') : t('meetingContent.view')}
            </ThemedText>
          </Pressable>
          {canManage && (
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => pressed && { opacity: 0.7 }}
            >
              <ThemedText type="small" style={{ color: theme.danger }}>
                {t('common.delete')}
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </ThemedView>
  );
}

function SelectedView({
  content,
  canManage,
  songTitle,
  onBack,
  onSaveItem,
  onAddItem,
  onDeleteItem,
}: {
  content: LoadedContent;
  canManage: boolean;
  songTitle: SongTitle;
  onBack: () => void;
  onSaveItem: (
    item: MeetingContentItem,
    data: Record<string, unknown>,
  ) => Promise<boolean>;
  onAddItem: () => void;
  onDeleteItem: (item: MeetingContentItem) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const issue = formatContentIssue(content.type, content);

  return (
    <View>
      <Pressable onPress={onBack} style={({ pressed }) => pressed && { opacity: 0.7 }}>
        <ThemedText type="small" style={{ color: theme.primary }}>
          ← {t('meetingContent.back')}
        </ThemedText>
      </Pressable>

      <View style={styles.selectedHeader}>
        <View style={styles.selectedTitleWrap}>
          {issue ? (
            <ThemedText type="default" style={[styles.contentIssue, { color: theme.primary }]}>
              {issue}
            </ThemedText>
          ) : null}
          <ThemedText type="default" style={styles.selectedTitle} numberOfLines={1}>
            {content.title || t('meetingContent.untitled')}
          </ThemedText>
          {content.coverTitle ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
              {content.coverTitle}
            </ThemedText>
          ) : null}
        </View>
        {canManage && (
          <Pressable
            onPress={onAddItem}
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: theme.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
              + {t('meetingContent.addItem')}
            </ThemedText>
          </Pressable>
        )}
      </View>

      {content.items.length === 0 ? (
        <ThemedText themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
          {t('meetingContent.noItems')}
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {content.items.map((item) => {
            const editing = editingId === item.id;
            const expanded = expandedId === item.id;
            return (
              <ThemedView key={item.id} type="backgroundElement" style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemSummaryWrap}>
                    <ItemSummary type={content.type} item={item} />
                  </View>
                  <View style={styles.itemActions}>
                    <Pressable
                      onPress={() => setExpandedId(expanded ? null : item.id)}
                      style={({ pressed }) => pressed && { opacity: 0.7 }}
                    >
                      <ThemedText type="small" style={{ color: theme.primary }}>
                        {expanded
                          ? t('meetingContent.hideContent')
                          : t('meetingContent.viewContent')}
                      </ThemedText>
                    </Pressable>
                    {canManage && (
                      <>
                        <Pressable
                          onPress={() => setEditingId(editing ? null : item.id)}
                          style={({ pressed }) => pressed && { opacity: 0.7 }}
                        >
                          <ThemedText type="small" style={{ color: theme.primary }}>
                            {editing ? t('common.cancel') : t('common.edit')}
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={() => onDeleteItem(item)}
                          style={({ pressed }) => pressed && { opacity: 0.7 }}
                        >
                          <ThemedText type="small" style={{ color: theme.danger }}>
                            {t('common.remove')}
                          </ThemedText>
                        </Pressable>
                      </>
                    )}
                  </View>
                </View>
                {expanded && (
                  <ItemDetail type={content.type} item={item} songTitle={songTitle} />
                )}
                {editing && canManage && (
                  <ItemEditor
                    type={content.type}
                    item={item}
                    songTitle={songTitle}
                    onSave={async (data) => {
                      const ok = await onSaveItem(item, data);
                      if (ok) setEditingId(null);
                      return ok;
                    }}
                  />
                )}
              </ThemedView>
            );
          })}
        </View>
      )}
    </View>
  );
}

function FlatView({
  type,
  items,
  canManage,
  songTitle,
  onAdd,
  onSaveItem,
  onDeleteItem,
  onDeleteAll,
}: {
  type: string;
  items: MeetingContentItem[];
  canManage: boolean;
  songTitle: SongTitle;
  onAdd: () => void;
  onSaveItem: (
    item: MeetingContentItem,
    data: Record<string, unknown>,
  ) => Promise<boolean>;
  onDeleteItem: (item: MeetingContentItem) => void;
  onDeleteAll: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const addButton = canManage ? (
    <Pressable
      onPress={onAdd}
      style={({ pressed }) => [
        styles.addBtn,
        { backgroundColor: theme.primary },
        pressed && { opacity: 0.8 },
      ]}
    >
      <ThemedText style={{ color: theme.primaryForeground, fontWeight: '600' }}>
        + {t('meetingContent.addItem')}
      </ThemedText>
    </Pressable>
  ) : null;

  if (items.length === 0) {
    return (
      <ThemedView type="backgroundElement" style={styles.flatEmpty}>
        <ThemedText themeColor="textSecondary">
          {t('meetingContent.empty')}
        </ThemedText>
        {addButton}
      </ThemedView>
    );
  }

  const q = query.trim().toLocaleLowerCase();
  const filtered = q
    ? items.filter((item) => {
        const d = item.data as { number?: number | null; theme?: string };
        const number = d.number != null ? String(d.number) : '';
        const theme = d.theme ?? '';
        return number.includes(q) || theme.toLocaleLowerCase().includes(q);
      })
    : items;

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.listMeta}>
        {query.trim()
          ? t('meetingContent.searchResultsCount', { count: filtered.length })
          : t('meetingContent.itemCount', { count: items.length })}
      </ThemedText>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('meetingContent.searchPlaceholder')}
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={t('meetingContent.searchLabel')}
        style={[
          styles.searchInput,
          { borderColor: theme.border, color: theme.text },
        ]}
      />
      {filtered.length === 0 ? (
        <ThemedText themeColor="textSecondary">
          {t('meetingContent.noSearchResults')}
        </ThemedText>
      ) : (
        <ThemedView type="backgroundElement" style={styles.flatList}>
          {filtered.map((item, index) => {
            const d = item.data as { number?: number | null; theme?: string };
            const editing = editingId === item.id;
            return (
              <View
                key={item.id}
                style={[
                  styles.flatItemRow,
                  index < filtered.length - 1 && styles.flatItemDivider,
                ]}
              >
                <View style={styles.itemHeader}>
                  <ThemedText type="default" numberOfLines={1} style={styles.flatItemText}>
                    {d.number != null ? (
                      <Text style={[styles.flatNumber, { color: theme.primary }]}>
                        {d.number}.{' '}
                      </Text>
                    ) : null}
                    {d.theme || '—'}
                  </ThemedText>
                  {canManage && (
                    <View style={styles.itemActions}>
                      <Pressable
                        onPress={() => setEditingId(editing ? null : item.id)}
                        style={({ pressed }) => pressed && { opacity: 0.7 }}
                      >
                        <ThemedText type="small" style={{ color: theme.primary }}>
                          {editing ? t('common.cancel') : t('common.edit')}
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        onPress={() => onDeleteItem(item)}
                        style={({ pressed }) => pressed && { opacity: 0.7 }}
                      >
                        <ThemedText type="small" style={{ color: theme.danger }}>
                          {t('common.remove')}
                        </ThemedText>
                      </Pressable>
                    </View>
                  )}
                </View>
                {editing && canManage && (
                  <ItemEditor
                    type={type}
                    item={item}
                    songTitle={songTitle}
                    onSave={async (data) => {
                      const ok = await onSaveItem(item, data);
                      if (ok) setEditingId(null);
                      return ok;
                    }}
                  />
                )}
              </View>
            );
          })}
        </ThemedView>
      )}
      <View style={styles.flatFooter}>
        {addButton}
        {canManage && (
          <Pressable
            onPress={onDeleteAll}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
          >
            <ThemedText type="small" style={{ color: theme.danger }}>
              {t('meetingContent.removeAll')}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function ItemSummary({ type, item }: { type: string; item: MeetingContentItem }) {
  const { t } = useTranslation();
  const data = item.data;

  if (type === 'apostila') {
    const d = data as unknown as {
      semana?: string;
      dateRange?: string;
      secoes?: unknown[];
    };
    return (
      <View style={styles.itemSummaryWrap}>
        <ThemedText type="default" numberOfLines={1} style={styles.itemTitle}>
          {d.semana || '—'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {[
            formatWeekRange(d.dateRange),
            t('meetingContent.sectionCount', { count: d.secoes?.length ?? 0 }),
          ]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      </View>
    );
  }

  if (type === 'sentinela') {
    const d = data as unknown as { week?: string; theme?: string };
    return (
      <View style={styles.itemSummaryWrap}>
        <ThemedText type="default" numberOfLines={1} style={styles.itemTitle}>
          {d.theme || '—'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {d.week}
        </ThemedText>
      </View>
    );
  }

  const d = data as unknown as { number?: number | null; theme?: string };
  return (
    <View style={styles.itemSummaryWrap}>
      <ThemedText type="default" numberOfLines={1} style={styles.itemTitle}>
        {d.number != null ? `${d.number}. ` : ''}
        {d.theme || '—'}
      </ThemedText>
    </View>
  );
}

function formatWeekRange(dateRange: string | undefined): string {
  if (!dateRange) return '';
  const m = dateRange.match(/^(\d{4})(\d{2})(\d{2})-(\d{4})(\d{2})(\d{2})$/);
  if (!m) return dateRange;
  const [, y1, m1, d1, y2, m2, d2] = m;
  if (y1 === y2 && m1 === m2) {
    return `${d1}-${d2}/${m1}/${y1}`;
  }
  return `${d1}/${m1}/${y1} - ${d2}/${m2}/${y2}`;
}

function ItemDetail({
  type,
  item,
  songTitle,
}: {
  type: string;
  item: MeetingContentItem;
  songTitle: SongTitle;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const data = item.data as Record<string, unknown>;

  if (type === 'apostila') {
    const d = data as unknown as {
      secoes?: {
        secao?: string;
        cancionMedia?: number | null;
        partes?: {
          order?: number;
          parte?: string;
          tema?: string;
          tempo?: string;
          modalidade?: string | null;
          fonte?: string | null;
        }[];
      }[];
    };
    const secoes = d.secoes ?? [];
    if (secoes.length === 0) {
      return (
        <ThemedText type="small" themeColor="textSecondary">
          {t('meetingContent.noItems')}
        </ThemedText>
      );
    }
    return (
      <View style={[styles.detailBox, { backgroundColor: theme.background }]}>
        {secoes.map((sec, si) => (
          <View key={si} style={styles.detailSection}>
            <View style={styles.detailSectionHeader}>
              <ThemedText type="smallBold" style={styles.detailSectionTitle} numberOfLines={1}>
                {sec.secao || '—'}
              </ThemedText>
              {sec.cancionMedia != null && (
                <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                  {t('meetingContent.middleSong')}: {sec.cancionMedia}
                </ThemedText>
              )}
            </View>
            <View style={styles.detailParts}>
              {(sec.partes ?? []).map((p, pi) => (
                <ThemedText key={pi} type="small" themeColor="textSecondary">
                  {p.order != null ? `${p.order}. ` : ''}
                  {p.parte || '—'}
                  {p.tema && p.tema !== p.parte ? ` — ${p.tema}` : ''}
                  {[p.tempo, p.modalidade, p.fonte].filter(Boolean).join(' · ')}
                </ThemedText>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'sentinela') {
    const d = data as unknown as {
      week?: string;
      theme?: string;
      songs?: {
        opening?: { number?: number | null; title?: string };
        closing?: { number?: number | null; title?: string };
      };
    };
    return (
      <View style={[styles.detailBox, styles.detailSentinela, { backgroundColor: theme.background }]}>
        <ThemedText type="small">
          <Text style={styles.detailLabel}>{t('meetingContent.theme')}: </Text>
          {d.theme || '—'}
        </ThemedText>
        <ThemedText type="small">
          <Text style={styles.detailLabel}>{t('meetingContent.week')}: </Text>
          {d.week || '—'}
        </ThemedText>
        <ThemedText type="small">
          <Text style={styles.detailLabel}>{t('meetingContent.openingSong')}: </Text>
          {d.songs?.opening?.number != null ? d.songs.opening.number : '—'}
          {songTitle(d.songs?.opening?.number)
            ? ` — ${songTitle(d.songs?.opening?.number)}`
            : ''}
        </ThemedText>
        <ThemedText type="small">
          <Text style={styles.detailLabel}>{t('meetingContent.closingSong')}: </Text>
          {d.songs?.closing?.number != null ? d.songs.closing.number : '—'}
          {songTitle(d.songs?.closing?.number)
            ? ` — ${songTitle(d.songs?.closing?.number)}`
            : ''}
        </ThemedText>
      </View>
    );
  }

  const d = data as unknown as { theme?: string };
  return (
    <View style={[styles.detailBox, { backgroundColor: theme.background }]}>
      <ThemedText type="small">{d.theme || '—'}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: 'row', justifyContent: 'center' },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
  },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.half,
    marginBottom: Spacing.four,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  primaryBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  secondaryBtn: {
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  list: { gap: Spacing.three },
  contentCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  contentInfo: { flex: 1, minWidth: 0, gap: Spacing.half },
  contentTitle: { fontWeight: '600' },
  contentIssue: { fontWeight: '700' },
  contentActions: { flexDirection: 'row', gap: Spacing.three },
  inlineBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
  },
  inlineItem: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  selectedTitleWrap: { flex: 1, minWidth: 0, gap: Spacing.half },
  selectedTitle: { fontWeight: '600' },
  addBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  itemCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  itemSummaryWrap: { flex: 1, minWidth: 0, gap: Spacing.half },
  itemTitle: { fontWeight: '500' },
  itemActions: { flexDirection: 'row', gap: Spacing.three, flexShrink: 0 },
  flatEmpty: {
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.five,
    borderRadius: Spacing.three,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 16,
    marginBottom: Spacing.three,
  },
  listMeta: {
    marginBottom: Spacing.two,
  },
  flatList: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  flatItemRow: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  flatItemDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flatItemText: { flex: 1, minWidth: 0 },
  flatNumber: { fontWeight: '700' },
  flatFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
  },
  detailBox: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  detailSection: { gap: Spacing.half },
  detailSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  detailSectionTitle: { flex: 1 },
  detailParts: { gap: Spacing.half },
  detailSentinela: { gap: Spacing.one },
  detailLabel: { fontWeight: '700' },
});
