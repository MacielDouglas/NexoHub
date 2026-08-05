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

function formatEventSummary(event: SpecialEvent) {
  const parts: string[] = [event.date];
  if (event.endDate) parts.push(`– ${event.endDate}`);
  if (event.time) parts.push("às", event.time);
  if (event.location) parts.push("·", event.location);
  return parts.join(" ");
}

export function SpecialEventsSection({ slug, events, eventTypeLabels }: Props) {
  return (
    <div className="space-y-6">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum evento especial cadastrado.
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-2xl bg-card px-5 py-3.5 shadow-sm ring-1 ring-border"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm">
                  <span className="font-medium">
                    {eventTypeLabels[event.type] ?? event.type}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {formatEventSummary(event)}
                  </span>
                </div>

                <form action={deleteSpecialEventAction}>
                  <input type="hidden" name="id" value={event.id} />
                  <input type="hidden" name="redirectTab" value="meetings" />
                  <SubmitButton className="rounded-lg border border-red-600 px-3 py-2 text-sm font-medium text-red-600 transition-opacity hover:opacity-80">
                    Remover
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

      <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <h3 className="mb-4 text-lg font-semibold">Novo evento especial</h3>
        <SpecialEventForm
          slug={slug}
          event={null}
          eventTypeLabels={eventTypeLabels}
        />
      </div>
    </div>
  );
}
