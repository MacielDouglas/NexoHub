import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { OptionPicker } from "@/components/option-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type SubOrg = {
  id: string;
  name: string;
  description: string | null;
  _count?: { people: number };
  people?: SubOrgPerson[];
};

type SubOrgPerson = {
  id: string;
  name: string;
  batizado: boolean;
  privilegioServico: boolean;
  talks: {
    id: string;
    meetingContentItemId: string;
    date: string | null;
    meetingContentItem: { id: string; data: { number?: number | null; theme?: string } };
  }[];
};

type ApprovedPerson = {
  id: string;
  name: string;
  sex: string;
  batizado: boolean;
  privilegioServico: boolean;
  discursoPublico: boolean;
};

type CatalogItem = {
  id: string;
  number: number | null;
  theme: string;
};

type PersonTalk = {
  id: string;
  personId: string;
  personName: string;
  meetingContentItemId: string;
  number: number | null;
  theme: string;
  lastDate: string | null;
};

type SelectedTalk = { meetingContentItemId: string; date: string };

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}

function talkLabel(item: { number?: number | null; theme?: string }): string {
  const num = item.number != null ? `${item.number} - ` : "";
  return `${num}${item.theme ?? ""}`;
}

export function GroupsDiscursosPanel() {
  const theme = useTheme();
  const { t } = useTranslation();
  const { organizationRole } = useAuth();
  const canManage = organizationRole === "owner" || organizationRole === "admin";

  const [subOrgs, setSubOrgs] = useState<SubOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [screen, setScreen] = useState<
    | { kind: "list" }
    | { kind: "main" }
    | { kind: "subOrg"; id: string }
  >({ kind: "list" });

  const fetchSubOrgs = useCallback(async () => {
    const res = await apiFetch("/api/sub-orgs");
    if (res.ok) {
      const data = await res.json();
      setSubOrgs(data.subOrgs ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await fetchSubOrgs();
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchSubOrgs]);

  const header = (
    <ThemedView style={styles.header}>
      <ThemedText type="subtitle" style={styles.title}>
        {t("meetings.tabGroups")}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        {t("people.subOrg.subtitle")}
      </ThemedText>
    </ThemedView>
  );

  if (screen.kind === "main") {
    return (
      <ThemedView style={styles.container}>
        <Pressable
          onPress={() => setScreen({ kind: "list" })}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <ThemedText type="small" style={{ color: theme.primary }}>
            ← {t("people.subOrg.back")}
          </ThemedText>
        </Pressable>
        <DiscursosPanel canManage={canManage} />
      </ThemedView>
    );
  }

  if (screen.kind === "subOrg") {
    return (
      <ThemedView style={styles.container}>
        <Pressable
          onPress={() => setScreen({ kind: "list" })}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
        >
          <ThemedText type="small" style={{ color: theme.primary }}>
            ← {t("people.subOrg.back")}
          </ThemedText>
        </Pressable>
        <SubOrgDetailPanel subOrgId={screen.id} canManage={canManage} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {header}
      {loading ? (
        <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: Spacing.four }}>
          {t("common.loading")}
        </ThemedText>
      ) : (
        <ThemedView style={styles.list}>
          <Pressable
            onPress={() => setScreen({ kind: "main" })}
            style={({ pressed }) => [
              styles.card,
              { borderColor: theme.border },
              pressed && { opacity: 0.8 },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={{ fontSize: 22 }}>🏠</ThemedText>
            </View>
            <ThemedView style={styles.cardBody}>
              <ThemedText type="default" style={{ fontWeight: "600" }}>
                {t("people.mainCongregation")}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t("people.mainCongregationTalks")}
              </ThemedText>
            </ThemedView>
            <ThemedText themeColor="textSecondary">›</ThemedText>
          </Pressable>

          {subOrgs.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.emptyCard}>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center" }}>
                {t("people.subOrg.empty")}
              </ThemedText>
            </ThemedView>
          ) : (
            subOrgs.map((subOrg) => (
              <Pressable
                key={subOrg.id}
                onPress={() => setScreen({ kind: "subOrg", id: subOrg.id })}
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: theme.border },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <View style={[styles.iconBox, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText style={{ fontSize: 22 }}>👥</ThemedText>
                </View>
                <ThemedView style={styles.cardBody}>
                  <ThemedText type="default" style={{ fontWeight: "600" }}>
                    {subOrg.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t("people.subOrg.peopleCount", { count: subOrg._count?.people ?? 0 })}
                    {subOrg.description ? ` · ${subOrg.description}` : ""}
                  </ThemedText>
                </ThemedView>
                <ThemedText themeColor="textSecondary">›</ThemedText>
              </Pressable>
            ))
          )}
        </ThemedView>
      )}
    </ThemedView>
  );
}

function DiscursosPanel({ canManage }: { canManage: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [people, setPeople] = useState<ApprovedPerson[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [talks, setTalks] = useState<PersonTalk[]>([]);
  const [loading, setLoading] = useState(true);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerPersonId, setPickerPersonId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [peopleRes, catalogRes, talksRes] = await Promise.all([
      apiFetch("/api/people?onlyApproved=true"),
      apiFetch("/api/meeting-content?type=discursos&includeItems=1"),
      apiFetch("/api/person-talks"),
    ]);
    if (peopleRes.ok) {
      const data = await peopleRes.json();
      setPeople(data.people ?? []);
    }
    if (catalogRes.ok) {
      const data = await catalogRes.json();
      const items = (data.contents ?? [])
        .flatMap((c: { items?: { id: string; data: { number?: number | null; theme?: string } }[] }) => c.items ?? [])
        .map((item: { id: string; data: { number?: number | null; theme?: string } }) => ({
          id: item.id,
          number: item.data.number ?? null,
          theme: item.data.theme ?? "",
        }));
      setCatalog(items);
    }
    if (talksRes.ok) {
      const data = await talksRes.json();
      const formatted = (data.talks ?? []).map(
        (talk: {
          id: string;
          personId: string;
          personName: string;
          meetingContentItemId: string;
          meetingContentItem: { data: { number?: number | null; theme?: string } };
          dates: { id: string; date: string; notes: string | null }[];
        }) => ({
          id: talk.id,
          personId: talk.personId,
          personName: talk.personName,
          meetingContentItemId: talk.meetingContentItemId,
          number: talk.meetingContentItem.data.number,
          theme: talk.meetingContentItem.data.theme,
          lastDate: talk.dates[0]?.date ?? null,
        }),
      );
      setTalks(formatted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await fetchAll();
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchAll]);

  const getAvailableTalks = useCallback(
    (personId: string) => {
      const assignedIds = talks.filter((d) => d.personId === personId).map((d) => d.meetingContentItemId);
      return catalog.filter((item) => !assignedIds.includes(item.id));
    },
    [talks, catalog],
  );

  const availableTalks = useMemo(
    () => (pickerPersonId ? getAvailableTalks(pickerPersonId) : []),
    [pickerPersonId, getAvailableTalks],
  );

  async function handleAddTalk(itemId: string) {
    if (!pickerPersonId) return;
    const res = await apiFetch("/api/person-talks", {
      method: "POST",
      body: JSON.stringify({ personId: pickerPersonId, meetingContentItemId: itemId }),
    });
    if (res.ok) {
      Alert.alert(t("people.discursos.addSuccess"));
      setPickerPersonId(null);
      await fetchAll();
    } else {
      const data = await res.json().catch(() => null);
      Alert.alert(t("common.error"), data?.error ?? t("people.discursos.addError"));
    }
  }

  function handleRemoveTalk(talk: PersonTalk) {
    Alert.alert(
      t("people.discursos.removeTalkConfirmTitle"),
      t("people.discursos.removeTalkConfirmDescription"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("people.discursos.removeTalk"),
          style: "destructive",
          onPress: async () => {
            const res = await apiFetch(`/api/person-talks/${talk.id}`, { method: "DELETE" });
            if (res.ok) {
              Alert.alert(t("people.discursos.removeSuccess"));
              await fetchAll();
            } else {
              Alert.alert(t("common.error"), t("people.discursos.removeError"));
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: Spacing.four }}>
        {t("common.loading")}
      </ThemedText>
    );
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle" style={styles.title}>
        {t("people.discursos.title")}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.subtitle}>
        {t("people.discursos.subtitle")}
      </ThemedText>

      {people.length === 0 && (
        <ThemedView type="backgroundElement" style={styles.emptyCard}>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center" }}>
            {t("people.discursos.noApprovedPeople")}
          </ThemedText>
        </ThemedView>
      )}

      <ThemedView style={styles.list}>
        {people.map((person) => {
          const personTalks = talks
            .filter((d) => d.personId === person.id)
            .sort((a, b) => {
              const na = a.number;
              const nb = b.number;
              if (na == null && nb == null) return 0;
              if (na == null) return 1;
              if (nb == null) return -1;
              return na - nb;
            });
          const available = getAvailableTalks(person.id);

          return (
            <ThemedView key={person.id} type="backgroundElement" style={styles.personCard}>
              <ThemedView style={styles.personHeader}>
                <ThemedView style={{ flex: 1 }}>
                  <ThemedText type="default" style={{ fontWeight: "600" }}>
                    {person.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {person.sex === "MALE" ? t("people.male") : t("people.female")}
                    {" · "}
                    {person.batizado ? t("people.baptized") : "—"}
                  </ThemedText>
                </ThemedView>
                {canManage && available.length > 0 && (
                  <Pressable
                    onPress={() => {
                      setPickerPersonId(person.id);
                      setPickerVisible(true);
                    }}
                    style={({ pressed }) => [styles.smallBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
                  >
                    <ThemedText type="small" style={{ color: theme.primary }}>
                      + {t("people.discursos.addTalk")}
                    </ThemedText>
                  </Pressable>
                )}
              </ThemedView>

              <ThemedView style={styles.talksList}>
                {personTalks.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center", paddingVertical: Spacing.two }}>
                    {t("people.discursos.noTalksAssigned")}
                  </ThemedText>
                ) : (
                  personTalks.map((talk) => (
                    <ThemedView key={talk.id} style={[styles.talkRow, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedView style={{ flex: 1 }}>
                        <ThemedText type="small" style={{ fontWeight: "600" }}>
                          {talk.number != null ? `${talk.number}. ` : ""}
                          {talk.theme || "—"}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {t("people.discursos.lastDate")}: {formatDate(talk.lastDate)}
                        </ThemedText>
                      </ThemedView>
                      {canManage && (
                        <Pressable onPress={() => handleRemoveTalk(talk)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                          <ThemedText type="small" style={{ color: theme.danger }}>
                            {t("people.discursos.removeTalk")}
                          </ThemedText>
                        </Pressable>
                      )}
                    </ThemedView>
                  ))
                )}
              </ThemedView>
            </ThemedView>
          );
        })}
      </ThemedView>

      <OptionPicker
        visible={pickerVisible}
        title={t("people.discursos.selectTalk")}
        options={availableTalks.map((talk) => ({ value: talk.id, label: talkLabel(talk) }))}
        selected={null}
        onSelect={(value) => {
          if (value) void handleAddTalk(value);
        }}
        onClose={() => {
          setPickerVisible(false);
          setPickerPersonId(null);
        }}
      />
    </ThemedView>
  );
}

function SubOrgDetailPanel({ subOrgId, canManage }: { subOrgId: string; canManage: boolean }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [subOrg, setSubOrg] = useState<SubOrg | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [formVisible, setFormVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState<SubOrgPerson | null>(null);
  const [personName, setPersonName] = useState("");
  const [selectedTalks, setSelectedTalks] = useState<SelectedTalk[]>([]);
  const [talkPickerVisible, setTalkPickerVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSubOrg = useCallback(async () => {
    const [subRes, catalogRes] = await Promise.all([
      apiFetch(`/api/sub-orgs?subOrgId=${subOrgId}`),
      apiFetch("/api/meeting-content?type=discursos&includeItems=1"),
    ]);
    if (subRes.ok) {
      const data = await subRes.json();
      setSubOrg(data.subOrg ?? null);
    }
    if (catalogRes.ok) {
      const data = await catalogRes.json();
      const items = (data.contents ?? [])
        .flatMap((c: { items?: { id: string; data: { number?: number | null; theme?: string } }[] }) => c.items ?? [])
        .map((item: { id: string; data: { number?: number | null; theme?: string } }) => ({
          id: item.id,
          number: item.data.number ?? null,
          theme: item.data.theme ?? "",
        }));
      setCatalog(items);
    }
    setLoading(false);
  }, [subOrgId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await fetchSubOrg();
      if (!cancelled) setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchSubOrg]);

  const catalogByItem = useMemo(() => new Map(catalog.map((c) => [c.id, c])), [catalog]);
  const usedItemIds = useMemo(() => new Set(selectedTalks.map((s) => s.meetingContentItemId)), [selectedTalks]);
  const availableCatalog = useMemo(() => catalog.filter((c) => !usedItemIds.has(c.id)), [catalog, usedItemIds]);

  function openCreate() {
    setEditingPerson(null);
    setPersonName("");
    setSelectedTalks([]);
    setFormVisible(true);
  }

  function openEdit(person: SubOrgPerson) {
    setEditingPerson(person);
    setPersonName(person.name);
    setSelectedTalks(
      person.talks.map((talk) => ({
        meetingContentItemId: talk.meetingContentItemId,
        date: talk.date ?? "",
      })),
    );
    setFormVisible(true);
  }

  function removeTalk(index: number) {
    setSelectedTalks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSavePerson() {
    if (!personName.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: personName.trim(),
        talks: selectedTalks.map((s) => ({
          meetingContentItemId: s.meetingContentItemId,
          date: s.date || null,
        })),
      };
      const res = editingPerson
        ? await apiFetch(`/api/sub-org-people/${editingPerson.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/sub-org-people", {
            method: "POST",
            body: JSON.stringify({ ...payload, subOrgId }),
          });
      if (res.ok) {
        Alert.alert(
          editingPerson ? t("people.subOrg.editPersonSuccess") : t("people.subOrg.addPersonSuccess"),
        );
        setFormVisible(false);
        setEditingPerson(null);
        await fetchSubOrg();
      } else {
        const data = await res.json().catch(() => null);
        Alert.alert(t("common.error"), data?.error ?? t("people.subOrg.savePersonError"));
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePerson(person: SubOrgPerson) {
    Alert.alert(
      t("people.subOrg.removePersonConfirmTitle"),
      t("people.subOrg.removePersonConfirmDescription"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("people.remove"),
          style: "destructive",
          onPress: async () => {
            const res = await apiFetch(`/api/sub-org-people/${person.id}`, { method: "DELETE" });
            if (res.ok) {
              Alert.alert(t("people.subOrg.removePersonSuccess"));
              await fetchSubOrg();
            } else {
              Alert.alert(t("common.error"), t("people.subOrg.removePersonError"));
            }
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: Spacing.four }}>
        {t("common.loading")}
      </ThemedText>
    );
  }

  if (!subOrg) {
    return (
      <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: Spacing.four }}>
        {t("people.subOrg.empty")}
      </ThemedText>
    );
  }

  const people = subOrg.people ?? [];

  return (
    <ThemedView style={styles.section}>
      <ThemedView style={styles.personHeader}>
        <ThemedView style={{ flex: 1 }}>
          <ThemedText type="subtitle" style={styles.title}>
            {subOrg.name}
          </ThemedText>
          {subOrg.description && (
            <ThemedText type="small" themeColor="textSecondary">
              {subOrg.description}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            {t("people.subOrg.peopleCount", { count: people.length })}
          </ThemedText>
        </ThemedView>
        {canManage && (
          <Pressable
            onPress={openCreate}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }]}
          >
            <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>
              + {t("people.subOrg.addPerson")}
            </ThemedText>
          </Pressable>
        )}
      </ThemedView>

      {people.length === 0 ? (
        <ThemedView type="backgroundElement" style={styles.emptyCard}>
          <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: "center" }}>
            {t("people.subOrg.noPeople")}
          </ThemedText>
        </ThemedView>
      ) : (
        <ThemedView style={styles.list}>
          {people.map((person) => (
            <ThemedView key={person.id} type="backgroundElement" style={styles.personCard}>
              <ThemedView style={styles.personHeader}>
                <ThemedView style={{ flex: 1 }}>
                  <ThemedText type="default" style={{ fontWeight: "600" }}>
                    {person.name}
                  </ThemedText>
                  {person.talks.length === 0 ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t("people.subOrg.noTalks")}
                    </ThemedText>
                  ) : (
                    person.talks.map((talk) => {
                      const item = catalogByItem.get(talk.meetingContentItemId);
                      const theme = item?.theme ?? talk.meetingContentItem.data.theme ?? "";
                      const date = formatDate(talk.date);
                      return (
                        <ThemedText key={talk.id} type="small" themeColor="textSecondary">
                          {talkLabel(item ?? { number: null, theme })} {date !== "—" ? `· ${date}` : ""}
                        </ThemedText>
                      );
                    })
                  )}
                </ThemedView>
                {canManage && (
                  <ThemedView style={styles.actions}>
                    <Pressable onPress={() => openEdit(person)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                      <ThemedText type="small" style={{ color: theme.primary }}>
                        {t("people.edit")}
                      </ThemedText>
                    </Pressable>
                    <Pressable onPress={() => handleDeletePerson(person)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                      <ThemedText type="small" style={{ color: theme.danger }}>
                        {t("people.remove")}
                      </ThemedText>
                    </Pressable>
                  </ThemedView>
                )}
              </ThemedView>
            </ThemedView>
          ))}
        </ThemedView>
      )}

      {formVisible && (
        <PersonForm
          name={personName}
          onChangeName={setPersonName}
          selectedTalks={selectedTalks}
          catalog={catalog}
          catalogByItem={catalogByItem}
          availableCatalog={availableCatalog}
          onAddTalk={(itemId) =>
            setSelectedTalks((prev) => [...prev, { meetingContentItemId: itemId, date: "" }])
          }
          onRemoveTalk={removeTalk}
          onChangeTalkDate={(index, date) =>
            setSelectedTalks((prev) => prev.map((s, i) => (i === index ? { ...s, date } : s)))
          }
          talkPickerVisible={talkPickerVisible}
          setTalkPickerVisible={setTalkPickerVisible}
          saving={saving}
          title={
            editingPerson
              ? t("people.subOrg.editPersonTitle")
              : t("people.subOrg.addPersonTitle")
          }
          onSave={handleSavePerson}
          onCancel={() => {
            setFormVisible(false);
            setEditingPerson(null);
          }}
        />
      )}
    </ThemedView>
  );
}

function PersonForm({
  name,
  onChangeName,
  selectedTalks,
  catalog,
  catalogByItem,
  availableCatalog,
  onAddTalk,
  onRemoveTalk,
  onChangeTalkDate,
  talkPickerVisible,
  setTalkPickerVisible,
  saving,
  title,
  onSave,
  onCancel,
}: {
  name: string;
  onChangeName: (v: string) => void;
  selectedTalks: SelectedTalk[];
  catalog: CatalogItem[];
  catalogByItem: Map<string, CatalogItem>;
  availableCatalog: CatalogItem[];
  onAddTalk: (itemId: string) => void;
  onRemoveTalk: (index: number) => void;
  onChangeTalkDate: (index: number, date: string) => void;
  talkPickerVisible: boolean;
  setTalkPickerVisible: (v: boolean) => void;
  saving: boolean;
  title: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedView type="backgroundElement" style={styles.formCard}>
      <ThemedText type="default" style={{ fontWeight: "700", marginBottom: Spacing.two }}>
        {title}
      </ThemedText>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("people.subOrg.personName")}</ThemedText>
        <TextInput
          value={name}
          onChangeText={onChangeName}
          placeholder={t("people.subOrg.personNamePlaceholder")}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        />
      </ThemedView>

      <ThemedView style={styles.field}>
        <Pressable
          onPress={() => setTalkPickerVisible(true)}
          style={({ pressed }) => [styles.smallBtn, { borderColor: theme.border }, pressed && { opacity: 0.7 }]}
        >
          <ThemedText type="small" style={{ color: theme.primary }}>
            + {t("people.subOrg.addTalk")}
          </ThemedText>
        </Pressable>
      </ThemedView>

      {selectedTalks.length > 0 && (
        <ThemedView style={styles.talksList}>
          {selectedTalks.map((talk, index) => {
            const item = catalogByItem.get(talk.meetingContentItemId);
            return (
              <ThemedView key={talk.meetingContentItemId} style={[styles.talkRow, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedView style={{ flex: 1, gap: Spacing.one }}>
                  <ThemedText type="small" style={{ fontWeight: "600" }}>
                    {item ? talkLabel(item) : talk.meetingContentItemId}
                  </ThemedText>
                  <TextInput
                    value={talk.date}
                    onChangeText={(date) => onChangeTalkDate(index, date)}
                    placeholder={t("people.subOrg.talkDate")}
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.input, styles.dateInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  />
                </ThemedView>
                <Pressable onPress={() => onRemoveTalk(index)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                  <ThemedText type="small" style={{ color: theme.danger }}>
                    {t("people.remove")}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            );
          })}
        </ThemedView>
      )}

      <ThemedView style={styles.actionsRow}>
        <Pressable
          onPress={onSave}
          disabled={saving || !name.trim()}
          style={({ pressed }) => [
            styles.primaryBtn,
            { backgroundColor: theme.primary },
            pressed && { opacity: 0.8 },
            (saving || !name.trim()) && { opacity: 0.5 },
          ]}
        >
          <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>
            {saving ? t("common.loading") : t("common.save")}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: theme.backgroundSelected }, pressed && { opacity: 0.8 }]}
        >
          <ThemedText style={{ fontWeight: "600" }}>{t("common.cancel")}</ThemedText>
        </Pressable>
      </ThemedView>

      <OptionPicker
        visible={talkPickerVisible}
        title={t("people.subOrg.selectTalkPlaceholder")}
        options={availableCatalog.map((item) => ({ value: item.id, label: talkLabel(item) }))}
        selected={null}
        onSelect={(value) => {
          if (value) onAddTalk(value);
        }}
        onClose={() => setTalkPickerVisible(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  header: { marginBottom: Spacing.four },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  backBtn: { paddingVertical: Spacing.two, marginBottom: Spacing.one },
  list: { gap: Spacing.two },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { flex: 1, gap: Spacing.half },
  emptyCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: "center",
  },
  section: { gap: Spacing.two },
  personCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  personHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  actions: { flexDirection: "row", gap: Spacing.three },
  talksList: { gap: Spacing.one },
  talkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.two,
  },
  smallBtn: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    alignSelf: "flex-start",
  },
  primaryBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: "center",
  },
  secondaryBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: "center",
  },
  formCard: {
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.two,
  },
  field: { gap: Spacing.one },
  input: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    fontSize: 16,
  },
  dateInput: { fontSize: 14 },
  actionsRow: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.two },
});
