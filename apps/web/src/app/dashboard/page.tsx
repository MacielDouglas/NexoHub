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

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("dashboard.title")}</h1>
          <p className="mt-1 text-muted-foreground">
            {t("dashboard.subtitle")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("dashboard.statMeetings")}</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {configs.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("dashboard.statParts")}</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {configs.reduce((sum, c) => sum + c.parts.length, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("dashboard.statMembers")}</CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {memberCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("dashboard.meetingsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {configs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("dashboard.noMeetings")}
              </p>
            ) : (
              <ul className="space-y-3">
                {configs.map((config) => (
                  <li
                    key={config.id}
                    className="flex items-center justify-between rounded-xl bg-background px-4 py-3 ring-1 ring-border"
                  >
                    <div>
                      <p className="font-medium">
                        {t(`settings.meetingType.${config.type}`)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t(`settings.days.${DAY_KEYS[config.dayOfWeek]}`)}{" "}
                        {t("settings.at")} {config.startTime}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {t("dashboard.meetingParts", {
                        count: config.parts.length,
                      })}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("dashboard.eventsTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("dashboard.noEvents")}
              </p>
            ) : (
              <ul className="space-y-3">
                {events.map((event) => (
                  <li
                    key={event.id}
                    className="flex items-center justify-between rounded-xl bg-background px-4 py-3 ring-1 ring-border"
                  >
                    <div>
                      <p className="font-medium">
                        {t(`settings.specialEventTypes.${event.type}`)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.date}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
