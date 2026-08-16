"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

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
import { cn } from "@/lib/utils";

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

type CleaningConfig = {
  weeklyEnabled: boolean;
  weeklyDayOfWeek: number | null;
  weeklyIntervalWeeks: number;
  generalEnabled: boolean;
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

export function CleaningClient() {
  const { t } = useTranslation();
  const [config, setConfig] = useState<CleaningConfig | null>(null);
  const [sectors, setSectors] = useState<CleaningSector[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{
    type: CleaningType;
    sector: CleaningSector | null;
  } | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchAll = useCallback(async () => {
    const res = await fetch("/api/cleaning");
    if (!res.ok) return;
    const data = await res.json();
    setConfig(data.config);
    setSectors(data.sectors);
  }, []);

  useEffect(() => {
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  async function updateConfig(update: Partial<CleaningConfig>) {
    setSavingConfig(true);
    try {
      const res = await fetch("/api/cleaning", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
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
    const res = await fetch(`/api/cleaning/sectors/${id}`, {
      method: "DELETE",
    });
    if (res.ok) await fetchAll();
  }

  async function handleRestore(id: string) {
    const res = await fetch(`/api/cleaning/sectors/${id}/restore`, {
      method: "POST",
    });
    if (res.ok) await fetchAll();
  }

  async function handleSaved() {
    setModal(null);
    await fetchAll();
  }

  if (loading || !config) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  const weeklySectors = sectors
    .filter((s) => s.type === "weekly")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const generalSectors = sectors
    .filter((s) => s.type === "general")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const meetingSectors = sectors
    .filter((s) => s.type === "meeting")
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
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">{t("cleaning.types.meeting")}</h2>
        <p className="mt-0.5 mb-4 text-sm text-muted-foreground">
          {t("cleaning.typesSubtitle.meeting")}
        </p>

        <SectorList
          sectors={meetingSectors}
          onEdit={(sector) => setModal({ type: "meeting", sector })}
          onDelete={handleDelete}
          onAdd={() => setModal({ type: "meeting", sector: null })}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold">{t("cleaning.types.weekly")}</h2>
        <p className="mt-0.5 mb-4 text-sm text-muted-foreground">
          {t("cleaning.typesSubtitle.weekly")}
        </p>

        {!config.weeklyEnabled ? (
          <EnableCard
            label={t("cleaning.enableWeekly")}
            disabled={savingConfig}
            onEnable={() => updateConfig({ weeklyEnabled: true })}
          />
        ) : (
          <>
            <div className="mb-4 rounded-2xl bg-card p-6 ring-1 ring-white/10">
              <WeeklySettings
                config={config}
                saving={savingConfig}
                onUpdate={updateConfig}
              />
            </div>
            <SectorList
              sectors={weeklySectors}
              onEdit={(sector) => setModal({ type: "weekly", sector })}
              onDelete={handleDelete}
              onAdd={() => setModal({ type: "weekly", sector: null })}
            />
          </>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">{t("cleaning.types.general")}</h2>
        <p className="mt-0.5 mb-4 text-sm text-muted-foreground">
          {t("cleaning.typesSubtitle.general")}
        </p>

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
      </section>

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
    </div>
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
  return (
    <button
      type="button"
      onClick={onEnable}
      disabled={disabled}
      className="w-full rounded-2xl border-2 border-dashed border-border bg-card px-6 py-8 text-sm font-medium text-primary transition-colors hover:border-primary/50 disabled:opacity-50"
    >
      {label}
    </button>
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
  const { t } = useTranslation();
  const [dayOfWeek, setDayOfWeek] = useState(config.weeklyDayOfWeek ?? 3);
  const [intervalWeeks, setIntervalWeeks] = useState(
    config.weeklyIntervalWeeks ?? 1,
  );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="weekly-day" className="mb-2 block text-sm font-medium">
          {t("cleaning.weeklyDayOfWeek")}
        </label>
        <select
          id="weekly-day"
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          {DAY_KEYS.map((key, index) => (
            <option key={key} value={index}>
              {t(`settings.days.${key}`)}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label
          htmlFor="weekly-interval"
          className="mb-2 block text-sm font-medium"
        >
          {t("cleaning.weeklyIntervalWeeks")}
        </label>
        <select
          id="weekly-interval"
          value={intervalWeeks}
          onChange={(e) => setIntervalWeeks(Number(e.target.value))}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? t("common.week") : t("common.weeks")}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() =>
            onUpdate({
              weeklyDayOfWeek: dayOfWeek,
              weeklyIntervalWeeks: intervalWeeks,
            })
          }
          disabled={saving}
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("common.save")}
        </button>
        <button
          type="button"
          onClick={() => onUpdate({ weeklyEnabled: false })}
          disabled={saving}
          className="rounded-full border border-destructive px-5 py-2.5 text-sm font-medium text-destructive transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {t("cleaning.disable")}
        </button>
      </div>
    </div>
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
  const { t } = useTranslation();

  return (
    <div>
      {sectors.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("cleaning.noSectors")}
        </p>
      ) : (
        <div className="mb-4 space-y-2">
          {sectors.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              onEdit={() => onEdit(sector)}
              onDelete={() => onDelete(sector.id)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground transition-opacity hover:opacity-90"
      >
        {t("cleaning.addSector")}
      </button>
    </div>
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
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-card px-5 py-3.5 ">
      <div className="min-w-0">
        <p className="font-medium">{sectorDisplayName(sector, t)}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {sectorDisplayTask(sector, t)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
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
        </p>
      </div>
      <div className="flex flex-col   shrink-0 items-center gap-5">
        <button
          type="button"
          onClick={onEdit}
          className="text-sm font-medium text-primary hover:underline "
        >
          {t("common.edit")}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-sm font-medium text-destructive hover:underline"
        >
          {t("common.remove")}
        </button>
      </div>
    </div>
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
        ? await fetch(`/api/cleaning/sectors/${sector.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/cleaning/sectors", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? t("common.error"));
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-card p-6 ring-1 ring-white/10">
        <h3 className="mb-4 text-lg font-semibold">
          {sector ? t("cleaning.editSector") : t("cleaning.newSector")}
        </h3>

        <div className="space-y-4">
          {!sector && defaults.length > 0 && (
            <div>
              <label
                htmlFor="sector-default"
                className="mb-2 block text-sm font-medium"
              >
                {t("cleaning.selectDefault")}
              </label>
              <select
                id="sector-default"
                value={defaultKey ?? ""}
                onChange={(e) =>
                  e.target.value ? selectDefault(e.target.value) : null
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
              >
                <option value="">{t("cleaning.custom")}</option>
                {defaults.map((def) => (
                  <option key={def.key} value={def.key}>
                    {sectorDefaultName(def, t)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="sector-name"
              className="mb-2 block text-sm font-medium"
            >
              {t("cleaning.sectorName")}
            </label>
            <input
              id="sector-name"
              type="text"
              value={form.name}
              onChange={(e) => updateForm({ name: e.target.value })}
              placeholder={t("cleaning.sectorName")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <label
              htmlFor="sector-task"
              className="mb-2 block text-sm font-medium"
            >
              {t("cleaning.task")}
            </label>
            <textarea
              id="sector-task"
              value={form.task}
              onChange={(e) => updateForm({ task: e.target.value })}
              rows={3}
              placeholder={t("cleaning.task")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium">
              {t("cleaning.unit")}
            </span>
            <UnitPicker
              type={type}
              selected={form.unit}
              onSelect={(unit) => updateForm({ unit })}
            />
          </div>

          {type === "meeting" && (
            <>
              <div>
                <label
                  htmlFor="sector-people-count"
                  className="mb-2 block text-sm font-medium"
                >
                  {t("cleaning.peopleCount")}
                </label>
                <input
                  id="sector-people-count"
                  type="number"
                  min={1}
                  value={form.peopleCount}
                  onChange={(e) => updateForm({ peopleCount: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.allowYoung}
                  onChange={(e) => updateForm({ allowYoung: e.target.checked })}
                  className="size-4 rounded border-border"
                />
                {t("cleaning.allowYoung")}
              </label>

              <div>
                <span className="mb-2 block text-sm font-medium">
                  {t("cleaning.gender")}
                </span>
                <GenderPicker
                  selected={form.gender}
                  onSelect={(gender) => updateForm({ gender })}
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-3">
            {onRestore && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {t("cleaning.restoreDefault")}
              </button>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t("common.save")}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-background"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </div>
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
  const { t } = useTranslation();
  const units = unitsForType(type);

  return (
    <div className="flex flex-wrap gap-1.5">
      {units.map((unit) => {
        const active = unit === selected;
        return (
          <button
            key={unit}
            type="button"
            onClick={() => onSelect(unit)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-center text-sm",
              active
                ? "border-primary bg-primary font-medium text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-primary/10 hover:text-foreground",
            )}
          >
            {t(`cleaning.units.${unit}`)}
          </button>
        );
      })}
    </div>
  );
}

function GenderPicker({
  selected,
  onSelect,
}: {
  selected: Gender;
  onSelect: (gender: Gender) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1.5">
      {(["male", "female", "any"] as const).map((gender) => {
        const active = gender === selected;
        return (
          <button
            key={gender}
            type="button"
            onClick={() => onSelect(gender)}
            className={cn(
              "rounded-full border border-border px-3 py-1.5 text-center text-sm",
              active
                ? "border-primary bg-primary font-medium text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-primary/10 hover:text-foreground",
            )}
          >
            {t(`cleaning.genders.${gender}`)}
          </button>
        );
      })}
    </div>
  );
}
