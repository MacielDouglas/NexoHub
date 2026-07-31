export const SPECIAL_EVENT_TYPES = [
  "memorial",
  "specialTalk",
  "circuitVisit",
  "convention",
  "assemblyTraveling",
  "assemblyRepresentative",
  "specialMeeting",
] as const;

export type SpecialEventType = (typeof SPECIAL_EVENT_TYPES)[number];

export const SPECIAL_EVENT_FIELDS: Record<
  SpecialEventType,
  { endDate: boolean; time: boolean; location: boolean }
> = {
  memorial: { endDate: false, time: true, location: false },
  specialTalk: { endDate: false, time: false, location: false },
  circuitVisit: { endDate: true, time: false, location: false },
  convention: { endDate: true, time: false, location: true },
  assemblyTraveling: { endDate: false, time: true, location: true },
  assemblyRepresentative: { endDate: false, time: true, location: true },
  specialMeeting: { endDate: false, time: true, location: false },
};

export const ANNUAL_EVENT_TYPES: SpecialEventType[] = [
  "memorial",
  "convention",
];

export function isSpecialEventType(value: string): value is SpecialEventType {
  return (SPECIAL_EVENT_TYPES as readonly string[]).includes(value);
}

export function parseEventDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatEventDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function serializeSpecialEvent(event: {
  id: string;
  organizationId: string;
  type: string;
  date: Date;
  endDate: Date | null;
  time: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: event.id,
    organizationId: event.organizationId,
    type: event.type,
    date: formatEventDate(event.date),
    endDate: event.endDate ? formatEventDate(event.endDate) : null,
    time: event.time,
    location: event.location,
  };
}
