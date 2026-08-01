import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { apiFetch } from "@/lib/api";
import {
  type CleaningSectorDefault,
  type CleaningType,
  type CleaningUnit,
  DEFAULT_SECTORS,
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

function sectorDefaultName(
  def: CleaningSectorDefault,
  t: (key: string) => string,
): string {
  const key = sectorNameKey({ defaultKey: def.key, type: def.type });
  return key ? t(key) : "";
}

function sectorDefaultTask(
  def: CleaningSectorDefault,
  t: (key: string) => string,
): string {
  const key = sectorTaskKey({ defaultKey: def.key, type: def.type });
  return key ? t(key) : "";
}

type CleaningConfig = {
  weeklyEnabled: boolean;
  weeklyDayOfWeek: number | null;
  weeklyIntervalWeeks: number;
  generalEnabled: boolean;
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
  const { t } = useTranslation();
  const [config, setConfig] = useState<CleaningConfig | null>(null);
  const [sectors, setSectors] = useState<CleaningSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    type: CleaningType;
    sector: CleaningSector | null;
  } | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

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

  async function updateConfig(update: Partial<CleaningConfig>) {
    setSavingConfig(true);
    try {
      const res = await apiFetch("/api/cleaning", {
        method: "PUT",
        body: JSON.stringify(update),
      });
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config);
      }
    } finally {
      setSavingConfig(false);
    }
  }

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
    setModal(null);
    await fetchAll();
  }

  if (loading || !config) {
    return (
      <ThemedText themeColor="textSecondary" style={styles.loadingText}>
        {t("common.loading")}
      </ThemedText>
    );
  }

  const meetingSectors = sectors
    .filter((s) => s.type === "meeting")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const weeklySectors = sectors
    .filter((s) => s.type === "weekly")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const generalSectors = sectors
    .filter((s) => s.type === "general")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const availableDefaults = (type: CleaningType): CleaningSectorDefault[] => {
    const present = new Set(
      sectors
        .filter((s) => s.type === type)
        .map((s) => s.defaultKey)
        .filter((k): k is string => Boolean(k)),
    );
    return DEFAULT_SECTORS.filter(
      (d) => d.type === type && !present.has(d.key),
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.section}>
        <ThemedText type="default" style={styles.sectionTitle}>
          {t("cleaning.types.meeting")}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sectionSubtitle}>
          {t("cleaning.typesSubtitle.meeting")}
        </ThemedText>

        <SectorList
          sectors={meetingSectors}
          onEdit={(sector) => setModal({ type: "meeting", sector })}
          onDelete={handleDelete}
          onAdd={() => setModal({ type: "meeting", sector: null })}
        />
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="default" style={styles.sectionTitle}>
          {t("cleaning.types.weekly")}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sectionSubtitle}>
          {t("cleaning.typesSubtitle.weekly")}
        </ThemedText>

        {!config.weeklyEnabled ? (
          <EnableCard
            label={t("cleaning.enableWeekly")}
            disabled={savingConfig}
            onEnable={() => updateConfig({ weeklyEnabled: true })}
          />
        ) : (
          <>
            <WeeklySettings
              config={config}
              saving={savingConfig}
              onUpdate={updateConfig}
            />
            <SectorList
              sectors={weeklySectors}
              onEdit={(sector) => setModal({ type: "weekly", sector })}
              onDelete={handleDelete}
              onAdd={() => setModal({ type: "weekly", sector: null })}
            />
          </>
        )}
      </ThemedView>

      <ThemedView style={styles.section}>
        <ThemedText type="default" style={styles.sectionTitle}>
          {t("cleaning.types.general")}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.sectionSubtitle}>
          {t("cleaning.typesSubtitle.general")}
        </ThemedText>

        {!config.generalEnabled ? (
          <EnableCard
            label={t("cleaning.enableGeneral")}
            disabled={savingConfig}
            onEnable={() => updateConfig({ generalEnabled: true })}
          />
        ) : (
          <SectorList
            sectors={generalSectors}
            onEdit={(sector) => setModal({ type: "general", sector })}
            onDelete={handleDelete}
            onAdd={() => setModal({ type: "general", sector: null })}
          />
        )}
      </ThemedView>

      {modal && (
        <SectorModal
          type={modal.type}
          sector={modal.sector}
          defaults={modal.sector ? [] : availableDefaults(modal.type)}
          onRestore={
            modal.sector?.defaultKey
              ? async () => {
                  if (modal.sector) {
                    await handleRestore(modal.sector.id);
                  }
                  setModal((m) => (m ? { ...m, sector: null } : null));
                }
              : undefined
          }
          onCancel={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </ThemedView>
  );
}

function EnableCard({
  label,
  disabled,
  onEnable,
}: {
  label: string;
  disabled: boolean;
  onEnable: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onEnable}
      disabled={disabled}
      style={({ pressed }) => [
        styles.enableCard,
        { borderColor: theme.primary },
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <ThemedText style={{ color: theme.primary, fontWeight: "600", textAlign: "center" }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function WeeklySettings({
  config,
  saving,
  onUpdate,
}: {
  config: CleaningConfig;
  saving: boolean;
  onUpdate: (update: Partial<CleaningConfig>) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [dayOfWeek, setDayOfWeek] = useState(config.weeklyDayOfWeek ?? 3);
  const [intervalWeeks, setIntervalWeeks] = useState(
    config.weeklyIntervalWeeks ?? 1,
  );

  return (
    <ThemedView type="backgroundElement" style={styles.weeklyCard}>
      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("cleaning.weeklyDayOfWeek")}</ThemedText>
        <DayPicker selected={dayOfWeek} onSelect={setDayOfWeek} />
      </ThemedView>

      <ThemedView style={styles.field}>
        <ThemedText type="small">{t("cleaning.weeklyIntervalWeeks")}</ThemedText>
        <IntervalPicker selected={intervalWeeks} onSelect={setIntervalWeeks} />
      </ThemedView>

      <ThemedView style={styles.actionsRow}>
        <Pressable
          onPress={() =>
            onUpdate({ weeklyDayOfWeek: dayOfWeek, weeklyIntervalWeeks: intervalWeeks })
          }
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
        <Pressable
          onPress={() => onUpdate({ weeklyEnabled: false })}
          disabled={saving}
          style={({ pressed }) => [
            styles.dangerBtn,
            pressed && { opacity: 0.8 },
            saving && { opacity: 0.5 },
          ]}
        >
          <ThemedText style={{ color: theme.danger, fontWeight: "600" }}>
            {t("cleaning.disable")}
          </ThemedText>
        </Pressable>
      </ThemedView>
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

function SectorList({
  sectors,
  onEdit,
  onDelete,
  onAdd,
}: {
  sectors: CleaningSector[];
  onEdit: (sector: CleaningSector) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <ThemedView style={styles.sectorsContainer}>
      {sectors.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
          {t("cleaning.noSectors")}
        </ThemedText>
      ) : (
        <ThemedView style={styles.sectorsList}>
          {sectors.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              onEdit={() => onEdit(sector)}
              onDelete={() => onDelete(sector.id)}
            />
          ))}
        </ThemedView>
      )}

      <Pressable
        onPress={onAdd}
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
    </ThemedView>
  );
}

function SectorCard({
  sector,
  onEdit,
  onDelete,
}: {
  sector: CleaningSector;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();

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
    </ThemedView>
  );
}

function SectorModal({
  type,
  sector,
  defaults,
  onRestore,
  onCancel,
  onSaved,
}: {
  type: CleaningType;
  sector: CleaningSector | null;
  defaults: CleaningSectorDefault[];
  onRestore?: () => void;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const units = unitsForType(type);
  const [defaultKey, setDefaultKey] = useState<string | null>(
    sector?.defaultKey ?? null,
  );
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
  const [restoring, setRestoring] = useState(false);

  function selectDefault(key: string) {
    const def = DEFAULT_SECTORS.find((d) => d.key === key && d.type === type);
    if (!def) return;
    setDefaultKey(def.key);
    setForm({
      name: sectorDefaultName(def, t),
      task: sectorDefaultTask(def, t),
      unit: def.unit,
      peopleCount: def.peopleCount?.toString() ?? "1",
      allowYoung: def.allowYoung ?? false,
      gender: def.gender ?? "any",
    });
  }

  function updateForm(update: Partial<SectorFormValues>) {
    setDefaultKey(null);
    setForm((f) => ({ ...f, ...update }));
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError(t("cleaning.sectorName"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        type,
        name: form.name.trim(),
        task: form.task.trim() || null,
        unit: form.unit,
      };
      if (defaultKey) payload.defaultKey = defaultKey;
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

  async function handleRestore() {
    if (!onRestore) return;
    setRestoring(true);
    try {
      await onRestore();
    } finally {
      setRestoring(false);
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <ThemedView type="backgroundElement" style={styles.modalContent}>
          <ThemedText type="default" style={{ fontWeight: "600", marginBottom: Spacing.three }}>
            {sector ? t("cleaning.editSector") : t("cleaning.newSector")}
          </ThemedText>

          {!sector && defaults.length > 0 && (
            <DefaultSelect
              type={type}
              defaults={defaults}
              value={defaultKey}
              onChange={selectDefault}
            />
          )}

          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("cleaning.sectorName")}</ThemedText>
            <TextInput
              value={form.name}
              onChangeText={(name) => updateForm({ name })}
              placeholder={t("cleaning.sectorName")}
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("cleaning.task")}</ThemedText>
            <TextInput
              value={form.task}
              onChangeText={(task) => updateForm({ task })}
              placeholder={t("cleaning.task")}
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, styles.taskInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
            />
          </ThemedView>

          <ThemedView style={styles.field}>
            <ThemedText type="small">{t("cleaning.unit")}</ThemedText>
            <UnitPicker type={type} selected={form.unit} onSelect={(unit) => updateForm({ unit })} />
          </ThemedView>

          {type === "meeting" && (
            <>
              <ThemedView style={styles.field}>
                <ThemedText type="small">{t("cleaning.peopleCount")}</ThemedText>
                <TextInput
                  value={form.peopleCount}
                  onChangeText={(peopleCount) => updateForm({ peopleCount })}
                  keyboardType="number-pad"
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                />
              </ThemedView>

              <ThemedView style={styles.field}>
                <ThemedText type="small">{t("cleaning.allowYoung")}</ThemedText>
                <Switch
                  value={form.allowYoung}
                  onValueChange={(allowYoung) => updateForm({ allowYoung })}
                  trackColor={{ true: theme.primary }}
                />
              </ThemedView>

              <ThemedView style={styles.field}>
                <ThemedText type="small">{t("cleaning.gender")}</ThemedText>
                <GenderPicker selected={form.gender} onSelect={(gender) => updateForm({ gender })} />
              </ThemedView>
            </>
          )}

          {error && <ThemedText type="small" style={{ color: theme.danger }}>{error}</ThemedText>}

          <ThemedView style={styles.actionsRow}>
            {onRestore && (
              <Pressable
                onPress={handleRestore}
                disabled={restoring}
                style={({ pressed }) => [
                  styles.restoreBtn,
                  { backgroundColor: theme.secondary },
                  pressed && { opacity: 0.8 },
                  restoring && { opacity: 0.5 },
                ]}
              >
                <ThemedText style={{ color: theme.secondaryForeground, fontWeight: "600", textAlign: "center" }}>
                  {t("cleaning.restoreDefault")}
                </ThemedText>
              </Pressable>
            )}
            <Pressable
              onPress={handleSubmit}
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
            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [
                styles.secondaryBtn,
                { backgroundColor: theme.backgroundSelected },
                pressed && { opacity: 0.8 },
              ]}
            >
              <ThemedText style={{ fontWeight: "600" }}>{t("common.cancel")}</ThemedText>
            </Pressable>
          </ThemedView>
        </ThemedView>
      </View>
    </Modal>
  );
}

function DefaultSelect({
  type,
  defaults,
  value,
  onChange,
}: {
  type: CleaningType;
  defaults: CleaningSectorDefault[];
  value: string | null;
  onChange: (key: string) => void;
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const selected = value
    ? DEFAULT_SECTORS.find((d) => d.key === value && d.type === type)
    : undefined;

  return (
    <ThemedView style={styles.field}>
      <ThemedText type="small">{t("cleaning.selectDefault")}</ThemedText>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.selectBtn,
          { backgroundColor: theme.background, borderColor: theme.border },
          pressed && { opacity: 0.8 },
        ]}
      >
        <ThemedText>
          {selected ? sectorDefaultName(selected, t) : t("cleaning.custom")}
        </ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <ThemedView type="backgroundElement" style={styles.modalContent}>
            <ThemedText type="default" style={{ fontWeight: "600", marginBottom: Spacing.two }}>
              {t("cleaning.selectDefault")}
            </ThemedText>
            <Pressable
              onPress={() => {
                onChange("");
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.selectOption,
                pressed && { opacity: 0.7 },
                !value && { backgroundColor: theme.backgroundSelected },
              ]}
            >
              <ThemedText style={{ fontWeight: value ? "400" : "600" }}>
                {t("cleaning.custom")}
              </ThemedText>
            </Pressable>
            {defaults.map((def) => {
              const active = def.key === value;
              return (
                <Pressable
                  key={def.key}
                  onPress={() => {
                    onChange(def.key);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.selectOption,
                    pressed && { opacity: 0.7 },
                    active && { backgroundColor: theme.backgroundSelected },
                  ]}
                >
                  <ThemedText style={{ fontWeight: active ? "600" : "400" }}>
                    {sectorDefaultName(def, t)}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {sectorDefaultTask(def, t)}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ThemedView>
        </Pressable>
      </Modal>
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
            style={[
              styles.typeChip,
              { borderColor: theme.primary },
              active && { backgroundColor: theme.primary },
            ]}
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
            style={[
              styles.typeChip,
              { borderColor: theme.primary },
              active && { backgroundColor: theme.primary },
            ]}
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
  enableCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: Spacing.three,
    paddingVertical: Spacing.five,
    alignItems: "center",
  },
  weeklyCard: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three, marginBottom: Spacing.three },
  field: { gap: Spacing.one },
  input: { borderRadius: Spacing.two, borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, fontSize: 16 },
  taskInput: { minHeight: 80, textAlignVertical: "top" },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  dayChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two, borderWidth: 1, minWidth: 92 },
  sectorsContainer: { gap: Spacing.three },
  sectorsList: { gap: Spacing.two },
  sectorCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  sectorInfo: { flex: 1, gap: Spacing.one },
  sectorActions: { flexDirection: "row", gap: Spacing.three, marginLeft: Spacing.two },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: Spacing.four },
  modalContent: { borderRadius: Spacing.three, padding: Spacing.four, gap: Spacing.three, maxHeight: "85%" },
  restoreBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
  selectBtn: { borderRadius: Spacing.two, borderWidth: 1, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  selectOption: { borderRadius: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.two, gap: Spacing.half },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one },
  typeChip: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Spacing.two, borderWidth: 1 },
  actionsRow: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.one },
  primaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
  secondaryBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1 },
  dangerBtn: { paddingVertical: Spacing.two, borderRadius: Spacing.two, alignItems: "center", flex: 1, borderWidth: 1, borderColor: "#DC2626" },
});
