import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Switch, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiFetch } from "@/lib/api";
import {
  CLEANING_TYPES,
  type CleaningType,
  type CleaningUnit,
  type Gender,
  sectorNameKey,
  sectorTaskKey,
  unitsForType,
} from "@/lib/cleaning-defaults";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type CleaningSector = {
  id: string;
  type: CleaningType;
  defaultKey: string | null;
  name: string | null;
  task: string | null;
  unit: CleaningUnit;
  peopleCount: number | null;
  allowYoung: boolean;
  gender: Gender;
  sortOrder: number;
};

type SectorFormValues = {
  name: string;
  task: string;
  unit: CleaningUnit;
  peopleCount: string;
  allowYoung: boolean;
  gender: Gender;
};

function sectorDisplayName(
  sector: CleaningSector,
  t: (key: string) => string,
): string {
  if (sector.name) return sector.name;
  const key = sectorNameKey(sector);
  return key ? t(key) : "";
}

function sectorDisplayTask(
  sector: CleaningSector,
  t: (key: string) => string,
): string {
  if (sector.task) return sector.task;
  const key = sectorTaskKey(sector);
  return key ? t(key) : "";
}

export function CleaningSettings() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [config, setConfig] = useState<{
    weeklyEnabled: boolean;
    weeklyDayOfWeek: number | null;
    weeklyIntervalWeeks: number;
  } | null>(null);
  const [sectors, setSectors] = useState<CleaningSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{
    type: CleaningType;
    sector: CleaningSector | null;
  } | null>(null);

  async function fetchAll() {
    const res = await apiFetch("/api/cleaning");
    if (!res.ok) return;
    const data = await res.json();
    setConfig(data.config);
    setSectors(data.sectors);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await apiFetch("/api/cleaning");
      if (cancelled) return;
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
        setSectors(data.sectors);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(id: string) {
    const res = await apiFetch(`/api/cleaning/sectors/${id}`, {
      method: "DELETE",
    });
    if (res.ok) await fetchAll();
  }

  async function handleRestore(id: string) {
    const res = await apiFetch(`/api/cleaning/sectors/${id}/restore`, {
      method: "POST",
    });
    if (res.ok) await fetchAll();
  }

  async function handleSaved() {
    setEditing(null);
    await fetchAll();
  }

  if (loading) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.loadingText}>
        {t("common.loading")}
      </ThemedText>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <WeeklyConfigSection
        config={config}
        onSaved={() => fetchAll()}
      />

      {CLEANING_TYPES.map((type) => {
        const typeSectors = sectors
          .filter((s) => s.type === type)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const isEditingType =
          editing?.type === type || editing?.sector?.type === type;
        return (
          <ThemedView key={type} style={styles.section}>
            <ThemedText type="default" style={styles.sectionTitle}>
              {t(`cleaning.types.${type}`)}
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.sectionSubtitle}>
              {t(`cleaning.typesSubtitle.${type}`)}
            </ThemedText>

            {typeSectors.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
                {t("cleaning.noSectors")}
              </ThemedText>
            ) : (
              <ThemedView style={styles.sectorsList}>
                {typeSectors.map((sector) => (
                  <SectorCard
                    key={sector.id}
                    sector={sector}
                    onEdit={() => setEditing({ type, sector })}
                    onDelete={() => handleDelete(sector.id)}
                    onRestore={
                      sector.defaultKey
                        ? () => handleRestore(sector.id)
                        : undefined
                    }
                  />
                ))}
              </ThemedView>
            )}

            {isEditingType ? (
              <SectorForm
                sector={editing?.sector ?? null}
                type={type}
                onCancel={() => setEditing(null)}
                onSaved={handleSaved}
              />
            ) : (
              <Pressable
                onPress={() => setEditing({ type, sector: null })}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  { backgroundColor: theme.backgroundSelected },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ThemedText style={{ fontWeight: "600" }}>
                  {t("cleaning.addSector")}
                </ThemedText>
              </Pressable>
            )}
          </ThemedView>
        );
      })}
    </ThemedView>
  );
}

function WeeklyConfigSection({
  config,
  onSaved,
}: {
  config: {
    weeklyEnabled: boolean;
    weeklyDayOfWeek: number | null;
    weeklyIntervalWeeks: number;
  } | null;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(config?.weeklyEnabled ?? false);
  const [dayOfWeek, setDayOfWeek] = useState(config?.weeklyDayOfWeek ?? 3);
  const [intervalWeeks, setIntervalWeeks] = useState(
    config?.weeklyIntervalWeeks ?? 1,
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await apiFetch("/api/cleaning", {
        method: "PUT",
        body: JSON.stringify({
          weeklyEnabled: enabled,
          weeklyDayOfWeek: dayOfWeek,
          weeklyIntervalWeeks: intervalWeeks,
        }),
      });
      if (res.ok) await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.weeklyCard}>
      <ThemedText type="default" style={styles.sectionTitle}>
        {t("cleaning.types.weekly")}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.sectionSubtitle}>
        {t("cleaning.typesSubtitle.weekly")}
      </ThemedText>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("cleaning.weeklyEnabled")}</ThemedText>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ true: theme.primary }}
        />
      </ThemedView>

      {enabled && (
        <>
          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("cleaning.weeklyDayOfWeek")}</ThemedText>
            <DayPicker selected={dayOfWeek} onSelect={setDayOfWeek} />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("cleaning.weeklyIntervalWeeks")}</ThemedText>
            <IntervalPicker selected={intervalWeeks} onSelect={setIntervalWeeks} />
          </ThemedView>
        </>
      )}

      <Pressable
        onPress={handleSave}
        disabled={saving}
        style={({ pressed }) => [
          styles.primaryBtn,
          { backgroundColor: theme.primary },
          pressed && { opacity: 0.8 },
          saving && { opacity: 0.5 },
        ]}
      >
        <ThemedText style={{ color: theme.primaryForeground, fontWeight: "600" }}>
          {t("common.save")}
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function DayPicker({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (day: number) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.dayGrid}>
      {DAY_KEYS.map((key, index) => {
        const active = index === selected;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(index)}
            style={[
              styles.dayChip,
              { borderColor: theme.primary },
              active && { backgroundColor: theme.primary },
            ]}
          >
            <ThemedText
              type="small"
              style={[active && { color: theme.primaryForeground }, { textAlign: "center" }]}
            >
              {t(`settings.days.${key}`)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function IntervalPicker({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (value: number) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.dayGrid}>
      {[1, 2, 3, 4].map((n) => {
        const active = n === selected;
        return (
          <Pressable
            key={n}
            onPress={() => onSelect(n)}
            style={[
              styles.dayChip,
              { borderColor: theme.primary },
              active && { backgroundColor: theme.primary },
            ]}
          >
            <ThemedText
              type="small"
              style={[active && { color: theme.primaryForeground }, { textAlign: "center" }]}
            >
              {n} {n === 1 ? t("common.week") : t("common.weeks")}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function SectorCard({
  sector,
  onEdit,
  onDelete,
  onRestore,
}: {
  sector: CleaningSector;
  onEdit: () => void;
  onDelete: () => void;
  onRestore?: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const isDefault = sector.defaultKey !== null;

  return (
    <ThemedView type="backgroundElement" style={styles.sectorCard}>
      <ThemedView style={styles.sectorInfo}>
        <ThemedText type="default" style={{ fontWeight: "600" }}>
          {sectorDisplayName(sector, t)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {sectorDisplayTask(sector, t)}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t(`cleaning.units.${sector.unit}`)}
          {sector.type === "meeting" && sector.peopleCount
            ? ` · ${sector.peopleCount} ${t("common.people")}`
            : ""}
          {sector.type === "meeting" && sector.allowYoung
            ? ` · ${t("cleaning.allowYoung")}`
            : ""}
          {sector.type === "meeting"
            ? ` · ${t(`cleaning.genders.${sector.gender}`)}`
            : ""}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.sectorActions}>
        {onRestore && (
          <Pressable onPress={onRestore} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <ThemedText style={{ color: theme.secondary, fontSize: 13 }}>
              {t("cleaning.restoreDefault")}
            </ThemedText>
          </Pressable>
        )}
        <Pressable onPress={onEdit} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <ThemedText style={{ color: theme.primary, fontSize: 13 }}>
            {t("common.edit")}
          </ThemedText>
        </Pressable>
        <Pressable onPress={onDelete} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
          <ThemedText style={{ color: theme.danger, fontSize: 13 }}>
            {t("common.remove")}
          </ThemedText>
        </Pressable>
      </ThemedView>
      {isDefault && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.defaultBadge}>
          {t("cleaning.sectors")}
        </ThemedText>
      )}
    </ThemedView>
  );
}

function SectorForm({
  type,
  sector,
  onCancel,
  onSaved,
}: {
  type: CleaningType;
  sector: CleaningSector | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const units = unitsForType(type);
  const [form, setForm] = useState<SectorFormValues>(() =>
    sector
      ? {
          name: sectorDisplayName(sector, t),
          task: sectorDisplayTask(sector, t),
          unit: sector.unit,
          peopleCount: sector.peopleCount?.toString() ?? "1",
          allowYoung: sector.allowYoung,
          gender: sector.gender,
        }
      : {
          name: "",
          task: "",
          unit: units[0],
          peopleCount: "1",
          allowYoung: false,
          gender: "any",
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError(t("cleaning.sectorName"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        task: form.task.trim() || null,
        unit: form.unit,
      };
      if (type === "meeting") {
        payload.peopleCount = Number(form.peopleCount) || null;
        payload.allowYoung = form.allowYoung;
        payload.gender = form.gender;
      }

      const res = sector
        ? await apiFetch(`/api/cleaning/sectors/${sector.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await apiFetch("/api/cleaning/sectors", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Erro");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView type="backgroundElement" style={styles.formCard}>
      <ThemedText type="default" style={{ fontWeight: "600", marginBottom: Spacing.three }}>
        {sector ? t("cleaning.editSector") : t("cleaning.newSector")}
      </ThemedText>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("cleaning.sectorName")}</ThemedText>
        <TextInput
          value={form.name}
          onChangeText={(name) => setForm({ ...form, name })}
          placeholder={t("cleaning.sectorName")}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("cleaning.task")}</ThemedText>
        <TextInput
          value={form.task}
          onChangeText={(task) => setForm({ ...form, task })}
          placeholder={t("cleaning.task")}
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[styles.input, styles.taskInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
        />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("cleaning.unit")}</ThemedText>
        <UnitPicker type={type} selected={form.unit} onSelect={(unit) => setForm({ ...form, unit })} />
      </ThemedView>

      {type === "meeting" && (
        <>
          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("cleaning.peopleCount")}</ThemedText>
            <TextInput
              value={form.peopleCount}
              onChangeText={(peopleCount) => setForm({ ...form, peopleCount })}
              keyboardType="number-pad"
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("cleaning.allowYoung")}</ThemedText>
            <Switch
              value={form.allowYoung}
              onValueChange={(allowYoung) => setForm({ ...form, allowYoung })}
              trackColor={{ true: theme.primary }}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("cleaning.gender")}</ThemedText>
            <GenderPicker selected={form.gender} onSelect={(gender) => setForm({ ...form, gender })} />
          </ThemedView>
        </>
      )}

      {error && <ThemedText type="small" style={{ color: theme.danger }}>{error}</ThemedText>}

      <ThemedView style={styles.actionsRow}>
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
      </ThemedView>
    </ThemedView>
  );
}

function UnitPicker({
  type,
  selected,
  onSelect,
}: {
  type: CleaningType;
  selected: CleaningUnit;
  onSelect: (unit: CleaningUnit) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const units = unitsForType(type);

  return (
    <View style={styles.typeGrid}>
      {units.map((unit) => {
        const active = unit === selected;
        return (
          <Pressable
            key={unit}
            onPress={() => onSelect(unit)}
            style={[styles.typeChip, { borderColor: theme.primary }, active && { backgroundColor: theme.primary }]}
          >
            <ThemedText
              type="small"
              style={[active && { color: theme.primaryForeground }, { textAlign: "center" }]}
            >
              {t(`cleaning.units.${unit}`)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function GenderPicker({
  selected,
  onSelect,
}: {
  selected: Gender;
  onSelect: (gender: Gender) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.typeGrid}>
      {(["male", "female", "any"] as const).map((gender) => {
        const active = gender === selected;
        return (
          <Pressable
            key={gender}
            onPress={() => onSelect(gender)}
            style={[styles.typeChip, { borderColor: theme.primary }, active && { backgroundColor: theme.primary }]}
          >
            <ThemedText
              type="small"
              style={[active && { color: theme.primaryForeground }, { textAlign: "center" }]}
            >
              {t(`cleaning.genders.${gender}`)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.four },
  section: { gap: Spacing.three },
  sectionTitle: { fontWeight: "700" },
  sectionSubtitle: { marginTop: -Spacing.one },
  loadingText: { textAlign: "center", marginTop: Spacing.four },
  weeklyCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three },
  field: { gap: Spacing.one },
  input: { borderRadius: Spacing.two, borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontSize: 16 },
  taskInput: { minHeight: 80, textAlignVertical: "top" },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  dayChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two, borderWidth: 1, minWidth: 92 },
  sectorsList: { gap: Spacing.two },
  sectorCard: { flexDirection: "column", gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  sectorInfo: { gap: Spacing.one },
  sectorActions: { flexDirection: "row", gap: Spacing.three, marginLeft: Spacing.two },
  defaultBadge: { fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 },
  formCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  typeChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two, borderWidth: 1 },
  actionsRow: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.one },
  primaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
  secondaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
});
