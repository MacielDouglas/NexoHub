"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  ANNUAL_EVENT_TYPES,
  SPECIAL_EVENT_FIELDS,
  SPECIAL_EVENT_TYPES,
  type SpecialEventType,
} from "@/lib/special-events";

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
  isActive: boolean;
  parts: MeetingPart[];
};

type SpecialEvent = {
  id: string;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
};

type SpecialEventForm = {
  type: SpecialEventType;
  date: string;
  endDate: string;
  time: string;
  location: string;
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const MEETING_TYPES = ["midweek", "weekend"] as const;

const EMPTY_EVENT_FORM: SpecialEventForm = {
  type: "memorial",
  date: "",
  endDate: "",
  time: "",
  location: "",
};

export default function SettingsPage() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [configRes, eventRes] = await Promise.all([
      fetch("/api/meeting-configs"),
      fetch("/api/special-events"),
    ]);
    if (configRes.ok) {
      const data = await configRes.json();
      if (data.configs) setConfigs(data.configs);
    }
    if (eventRes.ok) {
      const data = await eventRes.json();
      if (data.events) setEvents(data.events);
    }
  }, []);

  const init = useCallback(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="mb-1 text-lg font-medium">
              {t("settings.meetingDays")}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("settings.meetingDaysSubtitle")}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {MEETING_TYPES.map((type) => (
                <MeetingDayCard
                  key={type}
                  type={type}
                  config={configs.find((c) => c.type === type)}
                  onSaved={fetchAll}
                />
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-lg font-medium">
              {t("settings.specialEvents")}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {t("settings.specialEventsSubtitle")}
            </p>
            <SpecialEventsSection events={events} onChanged={fetchAll} />
          </section>
        </>
      )}
    </div>
  );
}

function MeetingDayCard({
  type,
  config,
  onSaved,
}: {
  type: string;
  config: MeetingConfig | undefined;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [dayOfWeek, setDayOfWeek] = useState(config?.dayOfWeek ?? 3);
  const [startTime, setStartTime] = useState(config?.startTime ?? "19:30");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = config
        ? await fetch(`/api/meeting-configs/${config.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dayOfWeek, startTime }),
          })
        : await fetch("/api/meeting-configs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, dayOfWeek, startTime }),
          });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Erro");
        return;
      }
      await onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
      <h3 className="text-lg font-medium">
        {t(`settings.meetingType.${type}`)}
      </h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {config
          ? `${t(`settings.days.${DAY_KEYS[config.dayOfWeek]}`)} ${t("settings.at")} ${config.startTime}`
          : t("settings.notConfigured")}
      </p>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor={`${type}-day`}
            className="mb-1 block text-sm font-medium"
          >
            {t("settings.dayOfWeek")}
          </label>
          <select
            id={`${type}-day`}
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
            htmlFor={`${type}-time`}
            className="mb-1 block text-sm font-medium"
          >
            {t("settings.startTime")}
          </label>
          <input
            id={`${type}-time`}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("common.save")}
        </button>
      </div>

      {config && (
        <div className="mt-6">
          <MeetingPartsList
            configId={config.id}
            parts={config.parts}
            onUpdate={onSaved}
          />
        </div>
      )}
    </div>
  );
}

function SpecialEventsSection({
  events,
  onChanged,
}: {
  events: SpecialEvent[];
  onChanged: () => void;
}) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function startCreate() {
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(event: SpecialEvent) {
    setEditingId(event.id);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/special-events/${id}`, { method: "DELETE" });
    if (res.ok) await onChanged();
  }

  return (
    <div>
      {events.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("settings.noSpecialEvents")}
        </p>
      ) : (
        <div className="mb-4 space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-2xl bg-card px-5 py-3.5 shadow-sm ring-1 ring-border"
            >
              <div className="text-sm">
                <span className="font-medium">
                  {t(`settings.specialEventTypes.${event.type}`)}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · {formatEventSummary(event, t)}
                </span>
              </div>
              <div className="flex shrink-0 gap-3">
                <button
                  type="button"
                  onClick={() => startEdit(event)}
                  className="text-sm font-medium text-[#2563EB] hover:underline"
                >
                  {t("common.edit")}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(event.id)}
                  className="text-sm font-medium text-red-500 hover:underline"
                >
                  {t("common.remove")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <SpecialEventForm
          key={editingId ?? "new"}
          event={events.find((e) => e.id === editingId) ?? null}
          onCancel={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setEditingId(null);
            void onChanged();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={startCreate}
          className="rounded-xl bg-[#1F2937] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {t("settings.newSpecialEvent")}
        </button>
      )}
    </div>
  );
}

function SpecialEventForm({
  event,
  onCancel,
  onSaved,
}: {
  event: SpecialEvent | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SpecialEventForm>(() =>
    event
      ? {
          type: event.type as SpecialEventType,
          date: event.date,
          endDate: event.endDate ?? "",
          time: event.time ?? "",
          location: event.location ?? "",
        }
      : EMPTY_EVENT_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = SPECIAL_EVENT_FIELDS[form.type];
  const isAnnual = (ANNUAL_EVENT_TYPES as readonly string[]).includes(
    form.type,
  );

  async function handleSubmit() {
    if (!form.date) {
      setError(t("settings.eventDate"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, string> = {
        type: form.type,
        date: form.date,
      };
      if (fields.endDate) payload.endDate = form.endDate;
      if (fields.time) payload.time = form.time;
      if (fields.location) payload.location = form.location;

      const res = event
        ? await fetch(`/api/special-events/${event.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/special-events", {
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
      <h3 className="mb-4 text-lg font-medium">
        {event ? t("settings.editSpecialEvent") : t("settings.newSpecialEvent")}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="special-event-type"
            className="mb-1 block text-sm font-medium"
          >
            {t("settings.specialEventType")}
          </label>
          <select
            id="special-event-type"
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as SpecialEventType,
              })
            }
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          >
            {SPECIAL_EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`settings.specialEventTypes.${type}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="special-event-date"
            className="mb-1 block text-sm font-medium"
          >
            {fields.endDate
              ? t("settings.eventStartDate")
              : t("settings.eventDate")}
          </label>
          <input
            id="special-event-date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
          />
        </div>
        {fields.endDate && (
          <div>
            <label
              htmlFor="special-event-end-date"
              className="mb-1 block text-sm font-medium"
            >
              {t("settings.eventEndDate")}
            </label>
            <input
              id="special-event-end-date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>
        )}
        {fields.time && (
          <div>
            <label
              htmlFor="special-event-time"
              className="mb-1 block text-sm font-medium"
            >
              {t("settings.eventTime")}
            </label>
            <input
              id="special-event-time"
              type="time"
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>
        )}
        {fields.location && (
          <div>
            <label
              htmlFor="special-event-location"
              className="mb-1 block text-sm font-medium"
            >
              {t("settings.eventLocation")}
            </label>
            <input
              id="special-event-location"
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder={t("settings.eventLocation")}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:border-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
            />
          </div>
        )}
      </div>
      {isAnnual && (
        <p className="mt-3 text-xs font-medium text-amber-600">
          {t("settings.onePerYear")}
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("common.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium transition-colors hover:bg-background"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

function formatEventSummary(
  event: SpecialEvent,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const parts: string[] = [event.date];
  if (event.endDate) parts.push(`– ${event.endDate}`);
  if (event.time) parts.push(t("settings.at"), event.time);
  if (event.location) parts.push("·", event.location);
  return parts.join(" ");
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
