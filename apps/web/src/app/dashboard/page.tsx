"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
  parts: { id: string }[];
};

type SpecialEvent = {
  id: string;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
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

const EVENT_EMOJI: Record<string, string> = {
  convention: "🏟️",
  assemblyTraveling: "👥",
  assemblyRepresentative: "👥",
  memorial: "🍷",
  specialTalk: "🎤",
  circuitVisit: "👫",
  specialMeeting: "👥",
};

function eventEmoji(type: string): string {
  return EVENT_EMOJI[type] ?? "⭐";
}

function nextDateForDay(dayOfWeek: number, time: string): Date {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let diff = (dayOfWeek - today.getDay() + 7) % 7;
  if (diff === 0) diff = 7;
  const next = new Date(today);
  next.setDate(next.getDate() + diff);
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  next.setHours(hours, minutes, 0, 0);
  return next;
}

function formatDate(date: Date, t: (key: string) => string): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayKey = date
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  if (date.getTime() === today.getTime()) return t("home.today");
  if (date.getTime() === tomorrow.getTime()) return t("home.tomorrow");
  return `${date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · ${t(`settings.days.${dayKey}`)}`;
}

function formatEventDate(
  event: SpecialEvent,
  t: (key: string, opts?: Record<string, unknown>) => string,
) {
  const parts: string[] = [event.date];
  if (event.endDate) parts.push(`– ${event.endDate}`);
  if (event.time) parts.push(` ${t("settings.at")} ${event.time}`);
  return parts.join(" ");
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<MeetingConfig[]>([]);
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [memberRes, configRes, eventRes] = await Promise.all([
      fetch("/api/members"),
      fetch("/api/meeting-configs"),
      fetch("/api/special-events"),
    ]);
    if (memberRes.ok) {
      const data = await memberRes.json();
      if (data.members) setMemberCount(data.members.length);
    }
    if (configRes.ok) {
      const data = await configRes.json();
      if (data.configs) setConfigs(data.configs);
    }
    if (eventRes.ok) {
      const data = await eventRes.json();
      if (data.events) setEvents(data.events);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const activeMeetings = configs.filter((c) => c.isActive);
  const upcomingMeetings = activeMeetings
    .map((config) => ({
      config,
      date: nextDateForDay(config.dayOfWeek, config.startTime),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const today = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate(),
  );
  const upcomingEvents = events
    .filter((event) => new Date(`${event.date}T00:00:00`) >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
      </div>

      <Card className="mb-8 bg-gradient-to-br from-primary to-[#7C3AED] text-primary-foreground shadow-xl">
        <CardHeader className="pb-2">
          <CardDescription className="text-primary-foreground/80">
            {t("home.nextMeeting")}
          </CardDescription>
          <CardTitle className="text-2xl font-semibold">
            {upcomingMeetings.length > 0
              ? formatDate(upcomingMeetings[0].date, t)
              : t("home.noMeetings")}
          </CardTitle>
        </CardHeader>
        {upcomingMeetings.length > 0 && (
          <CardContent>
            <p className="text-primary-foreground/90">
              {t(`settings.meetingType.${upcomingMeetings[0].config.type}`)}
              {` · ${t(`settings.days.${DAY_KEYS[upcomingMeetings[0].config.dayOfWeek]}`)} ${t("settings.at")} ${upcomingMeetings[0].config.startTime}`}
            </p>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("home.statMeetings")}</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {configs.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("home.statMembers")}</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {memberCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("home.statEvents")}</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {events.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {upcomingEvents.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("home.upcomingEvents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-4 rounded-xl bg-background px-4 py-3 ring-1 ring-border"
                >
                  <span className="text-2xl">{eventEmoji(event.type)}</span>
                  <div>
                    <p className="font-medium">
                      {t(`settings.specialEventTypes.${event.type}`)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatEventDate(event, t)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground">
                        {event.location}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">{t("home.schedule")}</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("home.noMeetings")}
            </p>
          ) : (
            <ul className="space-y-3">
              {upcomingMeetings.map(({ config, date }) => (
                <li
                  key={config.id}
                  className="flex items-center justify-between rounded-xl bg-background px-4 py-3 ring-1 ring-border"
                >
                  <div>
                    <p className="font-medium">
                      {t(`settings.meetingType.${config.type}`)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(date, t)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {t(`settings.days.${DAY_KEYS[config.dayOfWeek]}`)} ·{" "}
                    {config.startTime}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}