"use client";

import { useTranslation } from "react-i18next";
import { saveMeetingConfigAction } from "../actions/settings.actions";
import { SubmitButton } from "./submit-button";

const DAYS = [
  { value: 0, label: "sunday" },
  { value: 1, label: "monday" },
  { value: 2, label: "tuesday" },
  { value: 3, label: "wednesday" },
  { value: 4, label: "thursday" },
  { value: 5, label: "friday" },
  { value: 6, label: "saturday" },
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

export function MeetingDayForm({
  type,
  config,
  conductorCandidates = [],
}: Props) {
  const { t } = useTranslation();

  return (
    <form action={saveMeetingConfigAction} className="mt-4 space-y-4">
      <input type="hidden" name="id" defaultValue={config?.id ?? ""} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="redirectTab" value="meetings" />

      <div>
        <label
          htmlFor={`${type}-day`}
          className="mb-2 block text-sm font-medium"
        >
          {t("settings.dayOfWeek")}
        </label>
        <select
          id={`${type}-day`}
          name="dayOfWeek"
          defaultValue={String(config?.dayOfWeek ?? 3)}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
        >
          {DAYS.map((day) => (
            <option key={day.value} value={day.value}>
              {t(`settings.days.${day.label}`)}
            </option>
          ))}
        </select>
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
          name="startTime"
          type="time"
          defaultValue={config?.startTime ?? "19:30"}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
        />
      </div>

      {type === "weekend" && (
        <div>
          <label
            htmlFor={`${type}-default-conductor`}
            className="mb-2 block text-sm font-medium"
          >
            {t("meetings.defaultConductor")}
          </label>
          <select
            id={`${type}-default-conductor`}
            name="defaultSentinelaConductorId"
            defaultValue={config?.defaultSentinelaConductorId ?? ""}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
          >
            <option value="">{t("settings.noDefaultConductor")}</option>
            {conductorCandidates.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("settings.defaultConductorHint")}
          </p>
        </div>
      )}

      <SubmitButton className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
        {t("common.save")}
      </SubmitButton>
    </form>
  );
}
