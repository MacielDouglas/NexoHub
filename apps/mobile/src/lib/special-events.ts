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
