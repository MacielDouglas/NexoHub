"use client";

import { useTranslation } from "react-i18next";
import {
  ANNUAL_EVENT_TYPES,
  SPECIAL_EVENT_FIELDS,
  SPECIAL_EVENT_TYPES,
  type SpecialEventType,
} from "@/lib/special-events";
import { saveSpecialEventAction } from "../actions/settings.actions";
import { SubmitButton } from "./submit-button";

type SpecialEvent = {
  id: string;
  type: string;
  date: string;
  endDate: string | null;
  time: string | null;
  location: string | null;
};

type Props = {
  slug: string;
  event: SpecialEvent | null;
  eventTypeLabels: Record<string, string>;
};

export function SpecialEventForm({ event, eventTypeLabels }: Props) {
  const { t } = useTranslation();
  const selectedType = (event?.type ?? "memorial") as SpecialEventType;
  const fields = SPECIAL_EVENT_FIELDS[selectedType];
  const isAnnual = (ANNUAL_EVENT_TYPES as readonly string[]).includes(
    selectedType,
  );

  return (
    <form action={saveSpecialEventAction} className="space-y-4">
      <input type="hidden" name="id" value={event?.id ?? ""} />
      <input type="hidden" name="redirectTab" value="meetings" />

      <div>
        <label
          htmlFor={`type-${event?.id ?? "new"}`}
          className="mb-2 block text-sm font-medium"
        >
          {t("settings.specialEventType")}
        </label>
        <select
          id={`type-${event?.id ?? "new"}`}
          name="type"
          defaultValue={selectedType}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
        >
          {SPECIAL_EVENT_TYPES.map((type) => (
            <option key={type} value={type}>
              {eventTypeLabels[type] ?? type}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`date-${event?.id ?? "new"}`}
            className="mb-2 block text-sm font-medium"
          >
            {fields.endDate
              ? t("settings.eventStartDate")
              : t("settings.eventDate")}
          </label>
          <input
            id={`date-${event?.id ?? "new"}`}
            name="date"
            type="date"
            defaultValue={event?.date ?? ""}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
          />
        </div>

        {fields.endDate ? (
          <div>
            <label
              htmlFor={`endDate-${event?.id ?? "new"}`}
              className="mb-2 block text-sm font-medium"
            >
              {t("settings.eventEndDate")}
            </label>
            <input
              id={`endDate-${event?.id ?? "new"}`}
              name="endDate"
              type="date"
              defaultValue={event?.endDate ?? ""}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
        ) : null}

        {fields.time ? (
          <div>
            <label
              htmlFor={`time-${event?.id ?? "new"}`}
              className="mb-2 block text-sm font-medium"
            >
              {t("settings.eventTime")}
            </label>
            <input
              id={`time-${event?.id ?? "new"}`}
              name="time"
              type="time"
              defaultValue={event?.time ?? ""}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
        ) : null}

        {fields.location ? (
          <div>
            <label
              htmlFor={`location-${event?.id ?? "new"}`}
              className="mb-2 block text-sm font-medium"
            >
              {t("settings.eventLocation")}
            </label>
            <input
              id={`location-${event?.id ?? "new"}`}
              name="location"
              type="text"
              defaultValue={event?.location ?? ""}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm focus:outline-none"
            />
          </div>
        ) : null}
      </div>

      {isAnnual ? (
        <p className="text-xs font-medium text-muted-foreground">
          {t("settings.onePerYear")}
        </p>
      ) : null}

      <SubmitButton className="w-full rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
        {t("common.save")}
      </SubmitButton>
    </form>
  );
}
