export type CleaningType = "meeting" | "weekly" | "general";

export const MEETING_EVENT_TYPES = [
  "memorial",
  "circuitVisit",
  "specialMeeting",
] as const;

export const WEEKLY_BLOCKING_EVENT_TYPES = [
  "convention",
  "assemblyTraveling",
  "assemblyRepresentative",
] as const;

export type MeetingConfigLike = {
  type: string;
  dayOfWeek: number;
  isActive: boolean;
};

export type SpecialEventLike = {
  type: string;
  date: string;
  endDate: string | null;
};

export type SectorLike = {
  id: string;
  type: CleaningType;
  unit: string;
  peopleCount: number | null;
  allowYoung: boolean;
  gender: string;
  sortOrder: number;
};

export type PersonLike = {
  id: string;
  name: string;
  sex: string;
  young: boolean;
  active: boolean;
  limpeza: boolean;
  casada: boolean;
  familyId: string | null;
};

export type AssignmentDraft = {
  date: string;
  sectorId: string;
  personIds: string[];
};

export type HistoryEntry = {
  date: Date;
  personId: string;
  sectorId: string;
};

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function eachDayInRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(start);
  const last = startOfDay(end);
  while (current <= last) {
    dates.push(current);
    current = addDays(current, 1);
  }
  return dates;
}

export function getMeetingDates(
  start: Date,
  end: Date,
  configs: MeetingConfigLike[],
  events: SpecialEventLike[],
): Date[] {
  const activeDays = new Set(
    configs.filter((c) => c.isActive).map((c) => c.dayOfWeek),
  );
  const result: Date[] = [];

  for (const date of eachDayInRange(start, end)) {
    if (activeDays.has(date.getDay())) {
      result.push(date);
    }
  }

  const meetingEventDates = events
    .filter((e) => (MEETING_EVENT_TYPES as readonly string[]).includes(e.type))
    .map((e) => parseDateKey(e.date))
    .filter((d) => d >= startOfDay(start) && d <= startOfDay(end));

  for (const date of meetingEventDates) {
    if (!result.some((r) => isSameDay(r, date))) {
      result.push(date);
    }
  }

  return result.sort((a, b) => a.getTime() - b.getTime());
}

export function eventDatesInRange(
  start: Date,
  end: Date,
  events: SpecialEventLike[],
): SpecialEventLike[] {
  const s = startOfDay(start);
  const e = startOfDay(end);
  return events.filter((ev) => {
    const date = parseDateKey(ev.date);
    const endDate = ev.endDate ? parseDateKey(ev.endDate) : date;
    return endDate >= s && date <= e;
  });
}

export function weekHasBlockingEvent(
  date: Date,
  events: SpecialEventLike[],
): boolean {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 6);
  const evts = eventDatesInRange(weekStart, weekEnd, events);
  return evts.some((ev) =>
    (WEEKLY_BLOCKING_EVENT_TYPES as readonly string[]).includes(ev.type),
  );
}

export function weekHasEvent(date: Date, events: SpecialEventLike[]): boolean {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 6);
  return eventDatesInRange(weekStart, weekEnd, events).length > 0;
}

type ScheduleLike = {
  id: string;
  type: CleaningType;
  assignments: { date: Date }[];
};

export function validateDatesForType(args: {
  type: CleaningType;
  dates: Date[];
  existingSchedules: ScheduleLike[];
  events: SpecialEventLike[];
}): string | null {
  const { type, dates, existingSchedules, events } = args;
  if (dates.length === 0) return "no_dates";

  const sorted = dates.slice().sort((a, b) => a.getTime() - b.getTime());

  if (type === "meeting") {
    const blocked = new Set(
      existingSchedules
        .filter((s) => s.type === "meeting")
        .flatMap((s) => s.assignments)
        .map((a) => toDateKey(a.date)),
    );
    for (const date of sorted) {
      if (blocked.has(toDateKey(date))) return "date_conflict";
    }
    const unique = new Set(sorted.map(toDateKey));
    if (unique.size !== sorted.length) return "duplicate_date";
    return null;
  }

  if (type === "weekly") {
    const blockedWeeks = new Set(
      existingSchedules
        .filter((s) => s.type === "weekly")
        .flatMap((s) => s.assignments)
        .map((a) => toDateKey(startOfWeek(a.date))),
    );
    const generalWeeks = new Set(
      existingSchedules
        .filter((s) => s.type === "general")
        .flatMap((s) => s.assignments)
        .map((a) => toDateKey(startOfWeek(a.date))),
    );

    for (const date of sorted) {
      const weekKey = toDateKey(startOfWeek(date));
      if (blockedWeeks.has(weekKey)) return "weekly_week_conflict";
      if (generalWeeks.has(weekKey)) return "weekly_general_week";
      if (weekHasBlockingEvent(date, events)) return "blocking_event_week";
    }
    const seenWeeks = new Set<string>();
    for (const date of sorted) {
      const weekKey = toDateKey(startOfWeek(date));
      if (seenWeeks.has(weekKey)) return "weekly_week_conflict";
      seenWeeks.add(weekKey);
    }
    return null;
  }

  const weeklyWeeks = new Set(
    existingSchedules
      .filter((s) => s.type === "weekly")
      .flatMap((s) => s.assignments)
      .map((a) => toDateKey(startOfWeek(a.date))),
  );
  for (const date of sorted) {
    const weekKey = toDateKey(startOfWeek(date));
    if (weeklyWeeks.has(weekKey)) return "weekly_general_week";
  }
  return null;
}

export function buildHistoryIndex(history: HistoryEntry[]): {
  lastCleaned: Map<string, number>;
  lastSectorCleaned: Map<string, Map<string, number>>;
} {
  const lastCleaned = new Map<string, number>();
  const lastSectorCleaned = new Map<string, Map<string, number>>();

  for (const entry of history) {
    const ts = entry.date.getTime();
    const prev = lastCleaned.get(entry.personId);
    if (prev === undefined || ts > prev) lastCleaned.set(entry.personId, ts);

    let sectorMap = lastSectorCleaned.get(entry.personId);
    if (!sectorMap) {
      sectorMap = new Map<string, number>();
      lastSectorCleaned.set(entry.personId, sectorMap);
    }
    const prevSector = sectorMap.get(entry.sectorId);
    if (prevSector === undefined || ts > prevSector) {
      sectorMap.set(entry.sectorId, ts);
    }
  }

  return { lastCleaned, lastSectorCleaned };
}

function sectorNeeded(sector: SectorLike): number {
  if (sector.peopleCount != null && sector.peopleCount > 0) {
    return sector.peopleCount;
  }
  if (sector.unit === "person") return 1;
  if (sector.unit === "group") return 3;
  return 2;
}

function familyKey(person: PersonLike): string {
  return person.familyId ?? `single:${person.id}`;
}

function matchesGender(person: PersonLike, gender: string): boolean {
  if (gender === "male") return person.sex === "MALE";
  if (gender === "female") return person.sex === "FEMALE";
  return true;
}

function eligibleForSector(person: PersonLike, sector: SectorLike): boolean {
  if (!person.active || !person.limpeza) return false;
  if (sector.type === "meeting") {
    if (!sector.allowYoung && person.young) return false;
    if (!matchesGender(person, sector.gender)) return false;
  }
  return true;
}

export function generateDraft(args: {
  type: CleaningType;
  dates: Date[];
  sectors: SectorLike[];
  people: PersonLike[];
  history: HistoryEntry[];
}): AssignmentDraft[] {
  const { type, dates, sectors, people, history } = args;

  const index = buildHistoryIndex(history);
  const sortedSectors = sectors
    .filter((s) => s.type === type)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedDates = dates.slice().sort((a, b) => a.getTime() - b.getTime());

  const programSectorUsed = new Map<string, Set<string>>();
  const programTurns = new Map<string, number>();

  const rotationSort = (person: PersonLike, sectorId: string): number => {
    const last = index.lastSectorCleaned.get(person.id)?.get(sectorId);
    if (last !== undefined) return last;
    return index.lastCleaned.get(person.id) ?? -Infinity;
  };

  const sortCandidates = (
    list: PersonLike[],
    sectorId: string,
    dateFamilies: Set<string>,
  ): PersonLike[] =>
    [...list].sort((a, b) => {
      const aOnDate = dateFamilies.has(familyKey(a)) ? 0 : 1;
      const bOnDate = dateFamilies.has(familyKey(b)) ? 0 : 1;
      if (aOnDate !== bOnDate) return aOnDate - bOnDate;
      const ra = rotationSort(a, sectorId);
      const rb = rotationSort(b, sectorId);
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });

  const markAssigned = (person: PersonLike, sectorId: string, ts: number) => {
    index.lastCleaned.set(person.id, ts);
    let sectorMap = index.lastSectorCleaned.get(person.id);
    if (!sectorMap) {
      sectorMap = new Map();
      index.lastSectorCleaned.set(person.id, sectorMap);
    }
    sectorMap.set(sectorId, ts);
    programTurns.set(person.id, (programTurns.get(person.id) ?? 0) + 1);
    let usedSectors = programSectorUsed.get(person.id);
    if (!usedSectors) {
      usedSectors = new Set();
      programSectorUsed.set(person.id, usedSectors);
    }
    usedSectors.add(sectorId);
  };

  const drafts: AssignmentDraft[] = [];

  for (const date of sortedDates) {
    const ts = date.getTime();
    const dateUsed = new Set<string>();
    const dateFamilies = new Set<string>();

    for (const sector of sortedSectors) {
      const needed = sectorNeeded(sector);
      const pool = people.filter(
        (p) =>
          eligibleForSector(p, sector) &&
          !dateUsed.has(p.id) &&
          !programSectorUsed.get(p.id)?.has(sector.id),
      );
      if (pool.length === 0) continue;

      const fresh = pool.filter((p) => !programTurns.has(p.id));
      const repeat = pool.filter((p) => programTurns.has(p.id));
      const ordered = [
        ...sortCandidates(fresh, sector.id, dateFamilies),
        ...sortCandidates(repeat, sector.id, dateFamilies),
      ];
      const picked = ordered.slice(0, needed);

      for (const p of picked) {
        dateUsed.add(p.id);
        dateFamilies.add(familyKey(p));
        markAssigned(p, sector.id, ts);
      }

      if (picked.length > 0) {
        drafts.push({
          date: toDateKey(date),
          sectorId: sector.id,
          personIds: picked.map((p) => p.id),
        });
      }
    }
  }

  return drafts;
}
