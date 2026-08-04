import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type PersonData = {
  id: string;
  name: string;
  sex: "MALE" | "FEMALE";
  active: boolean;
  young: boolean;
  batizado: boolean;
  limpeza: boolean;
  estudante: boolean;
  privilegioServico: boolean;
  chefeFamilia: boolean;
  casada: boolean;
  familyId: string | null;
  family: { id: string; name: string } | null;
  user: { id: string; name: string; email: string } | null;
};

type FamilyData = { id: string; name: string };
type MemberUser = { id: string; name: string; email: string };
type Stats = {
  total: number;
  active: number;
  families: number;
  men: number;
  women: number;
  servicePrivilege: number;
};

const EMPTY_FORM = {
  name: "",
  sex: "MALE" as "MALE" | "FEMALE",
  active: true,
  young: false,
  batizado: false,
  limpeza: true,
  estudante: true,
  privilegioServico: false,
  chefeFamilia: false,
  casada: false,
  familyId: "",
  familyName: "",
  userId: "",
};

export default function PeopleScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const { t } = useTranslation();
  const { session } = useAuth();
  const [people, setPeople] = useState<PersonData[]>([]);
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [users, setUsers] = useState<MemberUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PersonData | null>(null);

  const currentRole = session?.user?.globalRole;
  const canManage = currentRole === "owner" || currentRole === "admin";

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
    web: { paddingTop: Spacing.six, paddingBottom: Spacing.four },
  });

  const fetchAll = useCallback(async () => {
    const res = await apiFetch("/api/people");
    if (res.ok) {
      const data = await res.json();
      if (data.people) setPeople(data.people);
      if (data.families) setFamilies(data.families);
      if (data.stats) setStats(data.stats);
    }
    const usersRes = await apiFetch("/api/members");
    if (usersRes.ok) {
      const data = await usersRes.json();
      if (data.members) {
        const linkedIds = new Set(
          people.filter((p) => p.user).map((p) => p.user!.id),
        );
        setUsers(
          data.members
            .map((m: { user: MemberUser }) => m.user)
            .filter((u: MemberUser) => !linkedIds.has(u.id)),
        );
      }
    }
    setLoading(false);
  }, [people]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await apiFetch("/api/people");
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        if (data.people) setPeople(data.people);
        if (data.families) setFamilies(data.families);
        if (data.stats) setStats(data.stats);
      }
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function startCreate() {
    setEditing(null);
    setShowForm(true);
  }

  function startEdit(person: PersonData) {
    setEditing(person);
    setShowForm(true);
  }

  async function handleDelete(id: string, name: string) {
    Alert.alert(t("people.removeTitle"), t("people.removeDescription", { name }), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("people.remove"),
        style: "destructive",
        onPress: async () => {
          const res = await apiFetch(`/api/people/${id}`, { method: "DELETE" });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            Alert.alert(t("common.error"), data?.error ?? t("people.error"));
            return;
          }
          Alert.alert(t("people.deleted"));
          await fetchAll();
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <ThemedView style={styles.container}>
        <ThemedText type="subtitle" style={styles.title}>{t("people.title")}</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.subtitle}>
          {t("people.subtitle")}
        </ThemedText>

        {canManage && !showForm && (
          <Pressable
            onPress={startCreate}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }]}
          >
            <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>{t("people.add")}</ThemedText>
          </Pressable>
        )}

        {showForm && (
          <PersonForm
            person={editing}
            families={families}
            users={users}
            onCancel={() => { setShowForm(false); setEditing(null); }}
            onSaved={async () => { setShowForm(false); setEditing(null); await fetchAll(); }}
          />
        )}

        {loading ? (
          <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: Spacing.four }}>
            {t("common.loading")}
          </ThemedText>
        ) : (
          <>
            {stats && (
              <ThemedView style={styles.statsGrid}>
                <StatCard label={t("people.stats.total")} value={stats.total} theme={theme} />
                <StatCard label={t("people.stats.active")} value={stats.active} theme={theme} />
                <StatCard label={t("people.stats.families")} value={stats.families} theme={theme} />
                <StatCard label={t("people.stats.men")} value={stats.men} theme={theme} />
                <StatCard label={t("people.stats.women")} value={stats.women} theme={theme} />
                <StatCard label={t("people.stats.servicePrivilege")} value={stats.servicePrivilege} theme={theme} />
              </ThemedView>
            )}

            {people.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.four }}>
                {t("people.noPeople")}
              </ThemedText>
            ) : (
              <ThemedView style={styles.list}>
                {people.map((person) => (
                  <ThemedView key={person.id} type="backgroundElement" style={styles.personRow}>
                    <ThemedView style={{ flex: 1 }}>
                      <ThemedText type="default" style={{ fontWeight: "600" }}>
                        {person.name}
                        {person.family ? ` · ${person.family.name}` : ""}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {person.sex === "MALE" ? t("people.male") : t("people.female")}
                        {person.young ? ` · ${t("people.young")}` : ""}
                        {person.batizado ? ` · ${t("people.baptized")}` : ""}
                        {person.privilegioServico ? ` · ${t("people.servicePrivilegeLabel")}` : ""}
                        {person.user ? ` · ↗ ${person.user.name}` : ""}
                      </ThemedText>
                    </ThemedView>
                    {canManage && (
                      <ThemedView style={styles.actions}>
                        <Pressable onPress={() => startEdit(person)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                          <ThemedText type="small" style={{ color: theme.primary }}>{t("people.edit")}</ThemedText>
                        </Pressable>
                        <Pressable onPress={() => handleDelete(person.id, person.name)} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                          <ThemedText type="small" style={{ color: theme.danger }}>{t("people.remove")}</ThemedText>
                        </Pressable>
                      </ThemedView>
                    )}
                  </ThemedView>
                ))}
              </ThemedView>
            )}
          </>
        )}
      </ThemedView>
    </ScrollView>
  );
}

function StatCard({ label, value, theme }: { label: string; value: number; theme: ReturnType<typeof useTheme> }) {
  return (
    <ThemedView type="backgroundElement" style={styles.statCard}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="default" style={{ fontWeight: "700", color: theme.primary }}>{value}</ThemedText>
    </ThemedView>
  );
}

function PersonForm({
  person,
  families,
  users,
  onCancel,
  onSaved,
}: {
  person: PersonData | null;
  families: FamilyData[];
  users: MemberUser[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [form, setForm] = useState(() =>
    person
      ? {
          name: person.name,
          sex: person.sex as "MALE" | "FEMALE",
          active: person.active,
          young: person.young,
          batizado: person.batizado,
          limpeza: person.limpeza,
          estudante: person.estudante,
          privilegioServico: person.privilegioServico,
          chefeFamilia: person.chefeFamilia,
          casada: person.casada,
          familyId: person.familyId ?? "",
          familyName: person.chefeFamilia ? person.family?.name ?? "" : "",
          userId: person.user?.id ?? "",
        }
      : { ...EMPTY_FORM },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showPrivServico = form.sex === "MALE" && form.batizado;
  const showDesig = form.sex === "MALE";
  const showPriv = form.sex === "MALE" && form.batizado;
  const showPrivServicoSection = showPrivServico && form.privilegioServico;

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError(t("people.errors.nameRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        sex: form.sex,
        active: form.active,
        young: form.young,
        batizado: form.batizado,
        limpeza: form.limpeza,
        estudante: form.estudante,
        privilegioServico: showPrivServico ? form.privilegioServico : false,
        chefeFamilia: form.chefeFamilia,
        casada: form.casada,
        familyId: form.familyId || null,
        familyName: form.familyName.trim() || null,
        userId: form.userId || null,
      };
      const res = person
        ? await apiFetch(`/api/people/${person.id}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/people", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? t("people.error"));
        return;
      }
      Alert.alert(t("people.saved"));
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.formCard}>
      <ThemedText type="default" style={{ fontWeight: "700", marginBottom: Spacing.three }}>
        {person ? t("people.edit") : t("people.add")}
      </ThemedText>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("people.form.name")}</ThemedText>
        <TextInput
          value={form.name}
          onChangeText={(name) => setForm({ ...form, name })}
          placeholder={t("people.form.namePlaceholder")}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("people.form.sex")}</ThemedText>
        <View style={styles.sexRow}>
          {(["MALE", "FEMALE"] as const).map((sex) => (
            <Pressable
              key={sex}
              onPress={() => setForm({ ...form, sex })}
              style={[
                styles.sexBtn,
                { borderColor: theme.primary },
                form.sex === sex && { backgroundColor: theme.primary },
              ]}
            >
              <ThemedText
                type="small"
                style={[form.sex === sex && { color: theme.primaryForeground }, { textAlign: "center" }]}
              >
                {sex === "MALE" ? t("people.male") : t("people.female")}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ThemedView>

      <ThemedView style={styles.togglesSection}>
        <ToggleRow label={t("people.activeLabel")} value={form.active} onValueChange={(v) => setForm({ ...form, active: v })} theme={theme} />
        <ToggleRow label={t("people.young")} value={form.young} onValueChange={(v) => setForm({ ...form, young: v })} theme={theme} />
        <ToggleRow label={t("people.baptized")} value={form.batizado} onValueChange={(v) => setForm({ ...form, batizado: v })} theme={theme} />
        <ToggleRow label={t("people.cleaning")} value={form.limpeza} onValueChange={(v) => setForm({ ...form, limpeza: v })} theme={theme} />
        <ToggleRow label={t("people.student")} value={form.estudante} onValueChange={(v) => setForm({ ...form, estudante: v })} theme={theme} />
        {showPrivServico && (
          <ToggleRow label={t("people.servicePrivilegeLabel")} value={form.privilegioServico} onValueChange={(v) => setForm({ ...form, privilegioServico: v })} theme={theme} />
        )}
      </ThemedView>

      <ThemedView style={styles.togglesSection}>
        <ThemedText type="small" style={{ fontWeight: "600", marginBottom: Spacing.one }}>{t("people.sectionFamily")}</ThemedText>
        <ToggleRow label={t("people.chefeFamilia")} value={form.chefeFamilia} onValueChange={(v) => setForm({ ...form, chefeFamilia: v, familyId: "", familyName: "" })} theme={theme} />
        <ToggleRow label={t("people.casada")} value={form.casada} onValueChange={(v) => setForm({ ...form, casada: v })} theme={theme} />
        {form.chefeFamilia ? (
          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("people.newFamilyName")}</ThemedText>
            <TextInput
              value={form.familyName}
              onChangeText={(familyName) => setForm({ ...form, familyName })}
              placeholder={t("people.form.familyNamePlaceholder")}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            />
          </ThemedView>
        ) : (
          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("people.selectFamily")}</ThemedText>
            <View style={styles.familyPicker}>
              <Pressable
                onPress={() => setForm({ ...form, familyId: "" })}
                style={[styles.familyBtn, { borderColor: theme.border }, !form.familyId && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              >
                <ThemedText type="small" style={[!form.familyId && { color: theme.primaryForeground }]}>{t("people.noFamily")}</ThemedText>
              </Pressable>
              {families.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setForm({ ...form, familyId: f.id })}
                  style={[styles.familyBtn, { borderColor: theme.border }, form.familyId === f.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                >
                  <ThemedText type="small" style={[form.familyId === f.id && { color: theme.primaryForeground }]}>{f.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          </ThemedView>
        )}
      </ThemedView>

      {showDesig && (
        <ThemedView style={styles.togglesSection}>
          <ThemedText type="small" style={{ fontWeight: "600", marginBottom: Spacing.one }}>{t("people.sectionAssignments")}</ThemedText>
          <ToggleRow label={t("people.leituraBiblia")} value={(form as Record<string, unknown>).leituraBiblia as boolean ?? false} onValueChange={(v) => setForm({ ...form, leituraBiblia: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.microfoneVolante")} value={(form as Record<string, unknown>).microfoneVolante as boolean ?? false} onValueChange={(v) => setForm({ ...form, microfoneVolante: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.som")} value={(form as Record<string, unknown>).som as boolean ?? false} onValueChange={(v) => setForm({ ...form, som: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.video")} value={(form as Record<string, unknown>).video as boolean ?? false} onValueChange={(v) => setForm({ ...form, video: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.palco")} value={(form as Record<string, unknown>).palco as boolean ?? false} onValueChange={(v) => setForm({ ...form, palco: v } as typeof form)} theme={theme} />
        </ThemedView>
      )}

      {showPriv && (
        <ThemedView style={styles.togglesSection}>
          <ThemedText type="small" style={{ fontWeight: "600", marginBottom: Spacing.one }}>{t("people.sectionPrivileges")}</ThemedText>
          <ToggleRow label={t("people.leitorEstudoBiblico")} value={(form as Record<string, unknown>).leitorEstudoBiblico as boolean ?? false} onValueChange={(v) => setForm({ ...form, leitorEstudoBiblico: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.leitorSentinela")} value={(form as Record<string, unknown>).leitorSentinela as boolean ?? false} onValueChange={(v) => setForm({ ...form, leitorSentinela: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.indicador")} value={(form as Record<string, unknown>).indicador as boolean ?? false} onValueChange={(v) => setForm({ ...form, indicador: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.oracao")} value={(form as Record<string, unknown>).oracao as boolean ?? false} onValueChange={(v) => setForm({ ...form, oracao: v } as typeof form)} theme={theme} />
        </ThemedView>
      )}

      {showPrivServicoSection && (
        <ThemedView style={styles.togglesSection}>
          <ThemedText type="small" style={{ fontWeight: "600", marginBottom: Spacing.one }}>{t("people.sectionServicePrivileges")}</ThemedText>
          <ToggleRow label={t("people.anciao")} value={(form as Record<string, unknown>).anciao as boolean ?? false} onValueChange={(v) => setForm({ ...form, anciao: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.presidenteVidaMinisterio")} value={(form as Record<string, unknown>).presidenteVidaMinisterio as boolean ?? false} onValueChange={(v) => setForm({ ...form, presidenteVidaMinisterio: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.discursoTesouros")} value={(form as Record<string, unknown>).discursoTesouros as boolean ?? false} onValueChange={(v) => setForm({ ...form, discursoTesouros: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.joiasEspirituais")} value={(form as Record<string, unknown>).joiasEspirituais as boolean ?? false} onValueChange={(v) => setForm({ ...form, joiasEspirituais: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.nossaVidaCrista")} value={(form as Record<string, unknown>).nossaVidaCrista as boolean ?? false} onValueChange={(v) => setForm({ ...form, nossaVidaCrista: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.necessidadesLocais")} value={(form as Record<string, unknown>).necessidadesLocais as boolean ?? false} onValueChange={(v) => setForm({ ...form, necessidadesLocais: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.condutorEstudoBiblico")} value={(form as Record<string, unknown>).condutorEstudoBiblico as boolean ?? false} onValueChange={(v) => setForm({ ...form, condutorEstudoBiblico: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.presidenteFimSemana")} value={(form as Record<string, unknown>).presidenteFimSemana as boolean ?? false} onValueChange={(v) => setForm({ ...form, presidenteFimSemana: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.discursoPublico")} value={(form as Record<string, unknown>).discursoPublico as boolean ?? false} onValueChange={(v) => setForm({ ...form, discursoPublico: v } as typeof form)} theme={theme} />
          <ToggleRow label={t("people.condutorSentinela")} value={(form as Record<string, unknown>).condutorSentinela as boolean ?? false} onValueChange={(v) => setForm({ ...form, condutorSentinela: v } as typeof form)} theme={theme} />
        </ThemedView>
      )}

      {error && <ThemedText type="small" style={{ color: theme.danger }}>{error}</ThemedText>}

      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleSubmit}
          disabled={saving}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: theme.primary }, pressed && { opacity: 0.8 }, saving && { opacity: 0.5 }]}
        >
          <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>{t("common.save")}</ThemedText>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: theme.backgroundSelected }, pressed && { opacity: 0.8 }]}
        >
          <ThemedText style={{ fontWeight: "600" }}>{t("common.cancel")}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

function ToggleRow({
  label,
  value,
  onValueChange,
  theme,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.toggleRow}>
      <ThemedText type="small" style={{ flex: 1 }}>{label}</ThemedText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexDirection: "row", justifyContent: "center" },
  container: { maxWidth: MaxContentWidth, flexGrow: 1, paddingHorizontal: Spacing.four, paddingTop: Spacing.six },
  title: { marginBottom: Spacing.one },
  subtitle: { marginBottom: Spacing.four },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two, marginBottom: Spacing.four },
  statCard: { flexGrow: 1, minWidth: 100, padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.one },
  list: { gap: Spacing.two },
  personRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  actions: { flexDirection: "row", gap: Spacing.three },
  formCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three, marginBottom: Spacing.four },
  field: { gap: Spacing.one },
  input: { borderRadius: Spacing.two, borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontSize: 16 },
  sexRow: { flexDirection: "row", gap: Spacing.one },
  sexBtn: { flex: 1, paddingVertical: Spacing.one, borderRadius: Spacing.two, borderWidth: 1 },
  togglesSection: { gap: Spacing.one, marginTop: Spacing.two },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: Spacing.one },
  familyPicker: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  familyBtn: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two, borderWidth: 1 },
  actionsRow: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.two },
  primaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
  secondaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
});
