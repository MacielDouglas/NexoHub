"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CleaningClient } from "@/components/cleaning-client";
import { authClient } from "@/lib/auth-client";
import {
  ANNUAL_EVENT_TYPES,
  SPECIAL_EVENT_FIELDS,
  SPECIAL_EVENT_TYPES,
  type SpecialEventType,
} from "@/lib/special-events";
import { cn } from "@/lib/utils";

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
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

export function SettingsClient({
  isSuperUser = false,
}: {
  isSuperUser?: boolean;
}) {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"meeting" | "cleaning">("meeting");

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
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="mt-1 text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <div className="mb-8 flex gap-1.5 rounded-xl bg-muted p-1.5">
        {(
          [
            ["meeting", "settings.tabMeeting"],
            ["cleaning", "settings.tabCleaning"],
          ] as const
        ).map(([value, label]) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(label)}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : (
        <>
          {tab === "meeting" ? (
            <>
              <section className="mb-12">
                <h2 className="mb-1 text-lg font-semibold">
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

              <section className="mb-12">
                <h2 className="mb-1 text-lg font-semibold">
                  {t("settings.specialEvents")}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">
                  {t("settings.specialEventsSubtitle")}
                </p>
                <SpecialEventsSection events={events} onChanged={fetchAll} />
              </section>
            </>
          ) : (
            <CleaningClient />
          )}

          <SignOutSection />
          {isSuperUser && <AdminSection />}
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
      <h3 className="text-lg font-semibold">
        {t(`settings.meetingType.${type}`)}
      </h3>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {config
          ? `${t(`settings.days.${DAY_KEYS[config.dayOfWeek]}`)} ${t("settings.at")} ${config.startTime}`
          : t("settings.notConfigured")}
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor={`${type}-day`}
            className="mb-2 block text-sm font-medium"
          >
            {t("settings.dayOfWeek")}
          </label>
          <DayPicker selected={dayOfWeek} onSelect={setDayOfWeek} />
        </div>
        <div>
          <label
            htmlFor={`${type}-time`}
            className="mb-2 block text-sm font-medium"
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
          className="w-full rounded-xl bg-[#2563EB] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {t("common.save")}
        </button>
      </div>
    </div>
  );
}

function DayPicker({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (day: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1.5">
      {DAY_KEYS.map((key, index) => {
        const active = index === selected;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              "min-w-[88px] rounded-lg border border-[#2563EB] px-3 py-1.5 text-center text-sm",
              active
                ? "bg-[#2563EB] font-medium text-white"
                : "bg-background text-foreground hover:bg-[#2563EB]/10",
            )}
          >
            {t(`settings.days.${key}`)}
          </button>
        );
      })}
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
      <h3 className="mb-4 text-lg font-semibold">
        {event ? t("settings.editSpecialEvent") : t("settings.newSpecialEvent")}
      </h3>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="special-event-type"
            className="mb-2 block text-sm font-medium"
          >
            {t("settings.specialEventType")}
          </label>
          <TypePicker
            selected={form.type}
            onSelect={(type) => setForm({ ...form, type })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="special-event-date"
              className="mb-2 block text-sm font-medium"
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
                className="mb-2 block text-sm font-medium"
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
                className="mb-2 block text-sm font-medium"
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
                className="mb-2 block text-sm font-medium"
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
  );
}

function TypePicker({
  selected,
  onSelect,
}: {
  selected: SpecialEventType;
  onSelect: (type: SpecialEventType) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1.5">
      {SPECIAL_EVENT_TYPES.map((type) => {
        const active = type === selected;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              "rounded-lg border border-[#2563EB] px-3 py-1.5 text-center text-sm",
              active
                ? "bg-[#2563EB] font-medium text-white"
                : "bg-background text-foreground hover:bg-[#2563EB]/10",
            )}
          >
            {t(`settings.specialEventTypes.${type}`)}
          </button>
        );
      })}
    </div>
  );
}

function SignOutSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      await fetch("/api/sign-out", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <section className="mb-12">
      <h2 className="mb-4 text-base font-semibold">{t("settings.account")}</h2>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="w-full rounded-xl border border-red-600 py-2.5 text-sm font-semibold text-red-600 transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {signingOut ? t("settings.signingOut") : t("settings.signOut")}
      </button>
    </section>
  );
}

function AdminSection() {
  const { t } = useTranslation();
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  async function handleExit() {
    setExiting(true);
    try {
      await fetch("/api/admin/exit-org", { method: "POST" });
      router.push("/admin");
      router.refresh();
    } finally {
      setExiting(false);
    }
  }

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold">
        {t("settings.adminAccess")}
      </h2>
      <button
        type="button"
        onClick={handleExit}
        disabled={exiting}
        className="w-full rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {exiting ? t("common.loading") : t("settings.exitOrg")}
      </button>
    </section>
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
