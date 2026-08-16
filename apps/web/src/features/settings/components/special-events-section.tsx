"use client";

import { useTranslation } from "react-i18next";
import { deleteSpecialEventAction } from "../actions/settings.actions";
import { SpecialEventForm } from "./special-event-form";
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
  events: SpecialEvent[];
  eventTypeLabels: Record<string, string>;
};

function formatEventSummary(event: SpecialEvent, atLabel: string) {
  const parts: string[] = [event.date];
  if (event.endDate) parts.push(`– ${event.endDate}`);
  if (event.time) parts.push(atLabel, event.time);
  if (event.location) parts.push("·", event.location);
  return parts.join(" ");
}

export function SpecialEventsSection({ slug, events, eventTypeLabels }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("settings.noSpecialEvents")}
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-card px-5 py-3.5 ring-1 ring-white/10"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm tabular-nums">
                  <span className="font-medium">
                    {eventTypeLabels[event.type] ?? event.type}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatEventSummary(event, t("settings.at"))}
                  </span>
                </div>

                <form action={deleteSpecialEventAction}>
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="redirectTab" value="meetings" />
                  <SubmitButton className="rounded-full border border-destructive px-3 py-2 text-sm font-medium text-destructive transition-opacity hover:opacity-80">
                    {t("common.remove")}
                  </SubmitButton>
                </form>
              </div>

              <div className="mt-4">
                <SpecialEventForm
                  slug={slug}
                  event={event}
                  eventTypeLabels={eventTypeLabels}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-card p-6 ring-1 ring-white/10">
        <h3 className="mb-4 text-lg font-semibold">
          {t("settings.newSpecialEvent")}
        </h3>
        <SpecialEventForm
          slug={slug}
          event={null}
          eventTypeLabels={eventTypeLabels}
        />
      </div>
    </div>
  );
}
