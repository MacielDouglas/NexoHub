"use client";

import { useTranslation } from "react-i18next";
import { MeetingDayForm } from "./meeting-day-form";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

type MeetingConfig = {
  id: string;
  type: string;
  dayOfWeek: number;
  startTime: string;
  isActive: boolean;
  defaultSentinelaConductorId: string | null;
};

type Person = {
  id: string;
  name: string;
};

type Props = {
  slug: string;
  type: "midweek" | "weekend";
  config?: MeetingConfig;
  conductorCandidates?: Person[];
};

export function MeetingDayCard({
  slug,
  type,
  config,
  conductorCandidates = [],
}: Props) {
  const { t } = useTranslation();

  const title = t(`settings.meetingType.${type}`);

  const summary = config
    ? `${t(`settings.days.${DAY_KEYS[config.dayOfWeek]}`)} ${t("settings.at")} ${config.startTime}`
    : t("settings.notConfigured");

  return (
    <div className="rounded-2xl bg-card p-6 ring-1 ring-white/10">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
        {summary}
      </p>
      <MeetingDayForm
        slug={slug}
        type={type}
        config={config}
        conductorCandidates={conductorCandidates}
      />
    </div>
  );
}
