"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type MeetingPart = {
  id: string;
  name: string;
  durationMinutes: number | null;
  sortOrder: number;
  description: string | null;
};

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number | null;
  isActive: boolean;
  parts: MeetingPart[];
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    type: string;
    dayOfWeek: number;
    startTime: string;
    durationMinutes: number | null;
  }>({
    type: "midweek",
    dayOfWeek: 3,
    startTime: "19:30",
    durationMinutes: 105,
  });

  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/meeting-configs");
      const data = await res.json();
      if (data.configs) setConfigs(data.configs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  async function handleSave() {
    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `/api/meeting-configs/${editingId}`
      : "/api/meeting-configs";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setEditingId(null);
      setForm({
        type: "midweek",
        dayOfWeek: 3,
        startTime: "19:30",
        durationMinutes: 105,
      });
      await fetchConfigs();
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/meeting-configs/${id}`, { method: "DELETE" });
    if (res.ok) await fetchConfigs();
  }

  function startEdit(config: MeetingConfig) {
    setEditingId(config.id);
    setForm({
      type: config.type,
      dayOfWeek: config.dayOfWeek,
      startTime: config.startTime,
      durationMinutes: config.durationMinutes ?? 105,
    });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">
          {t("settings.meetingConfig")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="mb-8 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <h2 className="mb-4 text-lg font-medium">
          {editingId ? t("settings.editConfig") : t("settings.newConfig")}
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="config-type"
              className="mb-1 block text-sm font-medium"
            >
              {t("settings.type")}
            </label>
            <select
              id="config-type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            >
              <option value="midweek">
                {t("settings.meetingType.midweek")}
              </option>
              <option value="weekend">
                {t("settings.meetingType.weekend")}
              </option>
            </select>
          </div>
          <div>
            <label
              htmlFor="config-day"
              className="mb-1 block text-sm font-medium"
            >
              {t("settings.dayOfWeek")}
            </label>
            <select
              id="config-day"
              value={form.dayOfWeek}
              onChange={(e) =>
                setForm({ ...form, dayOfWeek: Number(e.target.value) })
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            >
              {Object.entries(
                t("settings.days", { returnObjects: true }) as Record<
                  string,
                  string
                >,
              ).map(([key, name]) => (
                <option
                  key={key}
                  value={[
                    "sunday",
                    "monday",
                    "tuesday",
                    "wednesday",
                    "thursday",
                    "friday",
                    "saturday",
                  ].indexOf(key)}
                >
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="config-time"
              className="mb-1 block text-sm font-medium"
            >
              {t("settings.startTime")}
            </label>
            <input
              id="config-time"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>
          <div>
            <label
              htmlFor="config-duration"
              className="mb-1 block text-sm font-medium"
            >
              {t("settings.duration")}
            </label>
            <input
              id="config-duration"
              type="number"
              value={form.durationMinutes ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  durationMinutes: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            {editingId ? t("common.save") : t("common.create")}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({
                  type: "midweek",
                  dayOfWeek: 3,
                  startTime: "19:30",
                  durationMinutes: 105,
                });
              }}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-background"
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : configs.length === 0 ? (
        <p className="text-muted-foreground">{t("settings.noConfigs")}</p>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <div
              key={config.id}
              className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium">
                    {t(`settings.meetingType.${config.type}`)}
                  </h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {t(
                      `settings.days.${["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][config.dayOfWeek]}`,
                    )}{" "}
                    {t("settings.at")} {config.startTime}
                    {config.durationMinutes &&
                      ` · ${t("settings.minutes", { count: config.durationMinutes })}`}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(config)}
                    className="text-sm font-medium text-[#2563EB] hover:underline"
                  >
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(config.id)}
                    className="text-sm font-medium text-red-500 hover:underline"
                  >
                    {t("common.remove")}
                  </button>
                </div>
              </div>

              <MeetingPartsList
                configId={config.id}
                parts={config.parts}
                onUpdate={fetchConfigs}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingPartsList({
  configId,
  parts,
  onUpdate,
}: {
  configId: string;
  parts: MeetingPart[];
  onUpdate: () => void;
}) {
  const { t } = useTranslation();
  const [newPart, setNewPart] = useState<{
    name: string;
    durationMinutes: number | null;
    sortOrder: number;
  }>({
    name: "",
    durationMinutes: 10,
    sortOrder: parts.length + 1,
  });

  async function addPart() {
    if (!newPart.name) return;
    const res = await fetch(`/api/meeting-configs/${configId}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPart),
    });
    if (res.ok) {
      setNewPart({
        name: "",
        durationMinutes: 10,
        sortOrder: parts.length + 2,
      });
      onUpdate();
    }
  }

  async function deletePart(id: string) {
    const res = await fetch(`/api/meeting-parts/${id}`, { method: "DELETE" });
    if (res.ok) onUpdate();
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium tracking-wide text-muted-foreground uppercase">
        {t("settings.parts")}
      </h4>
      {parts.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">
          {t("settings.noParts")}
        </p>
      ) : (
        <div className="mb-4 space-y-2">
          {parts.map((part) => (
            <div
              key={part.id}
              className="flex items-center justify-between rounded-xl bg-background px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  #{part.sortOrder}
                </span>
                <span className="text-sm font-medium">{part.name}</span>
                {part.durationMinutes && (
                  <span className="text-xs text-muted-foreground">
                    {t("settings.minutes", { count: part.durationMinutes })}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => deletePart(part.id)}
                className="text-xs font-medium text-red-500 hover:underline"
              >
                {t("common.remove")}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder={t("settings.newPart")}
          value={newPart.name}
          onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
        />
        <input
          type="number"
          placeholder={t("settings.minShort")}
          value={newPart.durationMinutes ?? ""}
          onChange={(e) =>
            setNewPart({
              ...newPart,
              durationMinutes: e.target.value ? Number(e.target.value) : null,
            })
          }
          className="w-16 rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
        />
        <button
          type="button"
          onClick={addPart}
          className="rounded-xl bg-[#1F2937] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t("common.add")}
        </button>
      </div>
    </div>
  );
}
