"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  CLEANING_TYPES,
  type CleaningType,
  type CleaningUnit,
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
  const [savingWeekly, setSavingWeekly] = useState(false);

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

  async function updateWeekly(
    update: Partial<{
      weeklyEnabled: boolean;
      weeklyDayOfWeek: number | null;
      weeklyIntervalWeeks: number;
    }>,
  ) {
    setSavingWeekly(true);
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
      setSavingWeekly(false);
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
    setEditing(null);
    await fetchAll();
  }

  if (loading) {
    return <p className="text-muted-foreground">{t("common.loading")}</p>;
  }

  return (
    <div className="space-y-10">
      <WeeklyConfigSection
        config={config}
        saving={savingWeekly}
        onUpdate={updateWeekly}
      />

      {CLEANING_TYPES.map((type) => {
        const typeSectors = sectors
          .filter((s) => s.type === type)
          .sort((a, b) => a.sortOrder - b.sortOrder);
        const isEditingType =
          editing?.type === type || editing?.sector?.type === type;
        return (
          <section key={type}>
            <h2 className="text-lg font-semibold">
              {t(`cleaning.types.${type}`)}
            </h2>
            <p className="mt-0.5 mb-4 text-sm text-muted-foreground">
              {t(`cleaning.typesSubtitle.${type}`)}
            </p>

            {typeSectors.length === 0 ? (
              <p className="mb-4 text-sm text-muted-foreground">
                {t("cleaning.noSectors")}
              </p>
            ) : (
              <div className="mb-4 space-y-2">
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
              </div>
            )}

            {isEditingType ? (
              <SectorForm
                sector={editing?.sector ?? null}
                type={type}
                onCancel={() => setEditing(null)}
                onSaved={handleSaved}
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditing({ type, sector: null })}
                className="rounded-xl bg-[#1F2937] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                {t("cleaning.addSector")}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
}

function WeeklyConfigSection({
  config,
  saving,
  onUpdate,
}: {
  config: {
    weeklyEnabled: boolean;
    weeklyDayOfWeek: number | null;
    weeklyIntervalWeeks: number;
  } | null;
  saving: boolean;
  onUpdate: (update: {
    weeklyEnabled: boolean;
    weeklyDayOfWeek: number | null;
    weeklyIntervalWeeks: number;
  }) => void;
}) {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(config?.weeklyEnabled ?? false);
  const [dayOfWeek, setDayOfWeek] = useState(config?.weeklyDayOfWeek ?? 3);
  const [intervalWeeks, setIntervalWeeks] = useState(
    config?.weeklyIntervalWeeks ?? 1,
  );

  function handleSave() {
    onUpdate({
      weeklyEnabled: enabled,
      weeklyDayOfWeek: dayOfWeek,
      weeklyIntervalWeeks: intervalWeeks,
    });
  }

  return (
    <section className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
      <h2 className="text-lg font-semibold">{t("cleaning.types.weekly")}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {t("cleaning.typesSubtitle.weekly")}
      </p>

      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="size-4 rounded border-border"
          />
          {t("cleaning.weeklyEnabled")}
        </label>

        {enabled && (
          <>
            <div>
              <label
                htmlFor="weekly-day"
                className="mb-2 block text-sm font-medium"
              >
                {t("cleaning.weeklyDayOfWeek")}
              </label>
              <select
                id="weekly-day"
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
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
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? t("common.week") : t("common.weeks")}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("common.save")}
        </button>
      </div>
    </section>
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
  const { t } = useTranslation();
  const isDefault = sector.defaultKey !== null;

  return (
    <div className="rounded-2xl bg-card px-5 py-3.5 shadow-sm ring-1 ring-border">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{sectorDisplayName(sector, t)}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {sectorDisplayTask(sector, t)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
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
        <div className="flex shrink-0 gap-3">
          {onRestore && (
            <button
              type="button"
              onClick={onRestore}
              className="text-sm font-medium text-[#7C3AED] hover:underline"
            >
              {t("cleaning.restoreDefault")}
            </button>
          )}
          <button
            type="button"
            onClick={onEdit}
            className="text-sm font-medium text-[#2563EB] hover:underline"
          >
            {t("common.edit")}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-sm font-medium text-red-500 hover:underline"
          >
            {t("common.remove")}
          </button>
        </div>
      </div>
      {isDefault && (
        <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
          {t("cleaning.sectors")}
        </p>
      )}
    </div>
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
        setError(data?.error ?? "Erro");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
      <h3 className="mb-4 text-lg font-semibold">
        {sector ? t("cleaning.editSector") : t("cleaning.newSector")}
      </h3>
      <div className="space-y-4">
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
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={t("cleaning.sectorName")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
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
            onChange={(e) => setForm({ ...form, task: e.target.value })}
            rows={3}
            placeholder={t("cleaning.task")}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>

        <div>
          <span className="mb-2 block text-sm font-medium">
            {t("cleaning.unit")}
          </span>
          <UnitPicker
            type={type}
            selected={form.unit}
            onSelect={(unit) => setForm({ ...form, unit })}
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
                onChange={(e) =>
                  setForm({ ...form, peopleCount: e.target.value })
                }
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.allowYoung}
                onChange={(e) =>
                  setForm({ ...form, allowYoung: e.target.checked })
                }
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
                onSelect={(gender) => setForm({ ...form, gender })}
              />
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {t("common.save")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-background"
          >
            {t("common.cancel")}
          </button>
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
              "rounded-lg border border-[#2563EB] px-3 py-1.5 text-center text-sm",
              active
                ? "bg-[#2563EB] font-medium text-white"
                : "bg-background text-foreground hover:bg-[#2563EB]/10",
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
              "rounded-lg border border-[#2563EB] px-3 py-1.5 text-center text-sm",
              active
                ? "bg-[#2563EB] font-medium text-white"
                : "bg-background text-foreground hover:bg-[#2563EB]/10",
            )}
          >
            {t(`cleaning.genders.${gender}`)}
          </button>
        );
      })}
    </div>
  );
}
