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

function rotationSortKey(
  person: PersonLike,
  sectorId: string,
  index: {
    lastCleaned: Map<string, number>;
    lastSectorCleaned: Map<string, Map<string, number>>;
  },
): number {
  const last = index.lastSectorCleaned.get(person.id)?.get(sectorId);
  if (last !== undefined) return last;
  const global = index.lastCleaned.get(person.id);
  return global ?? -Infinity;
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

function pickForSector(args: {
  sector: SectorLike;
  needed: number;
  candidates: PersonLike[];
  index: {
    lastCleaned: Map<string, number>;
    lastSectorCleaned: Map<string, Map<string, number>>;
  };
}): PersonLike[] {
  const { sector, needed, candidates, index } = args;

  const eligible = candidates.filter((p) => eligibleForSector(p, sector));
  const used = new Set<string>();
  const selection: PersonLike[] = [];

  const fillWith = (pool: PersonLike[]) => {
    const sortedPool = [...pool].sort(
      (a, b) =>
        rotationSortKey(a, sector.id, index) -
          rotationSortKey(b, sector.id, index) || a.name.localeCompare(b.name),
    );
    for (const p of sortedPool) {
      if (selection.length >= needed) break;
      if (used.has(p.id)) continue;
      selection.push(p);
      used.add(p.id);
    }
  };

  const familyGroups = new Map<string, PersonLike[]>();
  for (const p of eligible) {
    const key = p.familyId ?? `single:${p.id}`;
    const list = familyGroups.get(key) ?? [];
    list.push(p);
    familyGroups.set(key, list);
  }

  const sortedFamilies = [...familyGroups.entries()].sort((a, b) => {
    const scoreA = Math.min(
      ...a[1].map((p) => rotationSortKey(p, sector.id, index)),
    );
    const scoreB = Math.min(
      ...b[1].map((p) => rotationSortKey(p, sector.id, index)),
    );
    return scoreA - scoreB;
  });

  for (const [, members] of sortedFamilies) {
    if (selection.length >= needed) break;
    if (members.some((m) => used.has(m.id))) continue;
    const available = members.filter((m) => !used.has(m.id));
    const couples = available.filter(
      (p) => p.casada && p.familyId && matchesGender(p, sector.gender),
    );
    if (available.length >= needed) {
      const picked = [
        ...couples,
        ...available.filter((p) => !couples.includes(p)),
      ].slice(0, needed);
      selection.push(...picked);
      for (const p of picked) used.add(p.id);
    } else {
      selection.push(...available);
      for (const p of available) used.add(p.id);
    }
  }

  if (selection.length < needed) {
    const pool = eligible.filter((p) => !used.has(p.id));
    fillWith(pool);
  }

  return selection.slice(0, needed);
}

export function generateMeetingAssignments(args: {
  dates: Date[];
  sectors: SectorLike[];
  people: PersonLike[];
  history: HistoryEntry[];
}): AssignmentDraft[] {
  const { dates, sectors, people, history } = args;
  const index = buildHistoryIndex(history);
  const sortedSectors = sectors
    .filter((s) => s.type === "meeting")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const drafts: AssignmentDraft[] = [];

  for (const date of dates) {
    const usedPeople = new Set<string>();
    for (const sector of sortedSectors) {
      const needed = sector.peopleCount ?? 1;
      const candidates = people.filter((p) => !usedPeople.has(p.id));
      const picked = pickForSector({ sector, needed, candidates, index });
      for (const p of picked) usedPeople.add(p.id);
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

export function generateFamilyGroupAssignments(args: {
  dates: Date[];
  sectors: SectorLike[];
  people: PersonLike[];
  history: HistoryEntry[];
}): AssignmentDraft[] {
  const { dates, sectors, people, history } = args;
  const index = buildHistoryIndex(history);
  const active = people.filter((p) => p.active && p.limpeza);
  const sortedSectors = sectors.sort((a, b) => a.sortOrder - b.sortOrder);
  const drafts: AssignmentDraft[] = [];

  for (const date of dates) {
    const usedPeople = new Set<string>();
    for (const sector of sortedSectors) {
      const candidates = active.filter((p) => !usedPeople.has(p.id));
      const eligible = candidates.filter((p) => eligibleForSector(p, sector));
      const familyGroups = new Map<string, PersonLike[]>();
      for (const p of eligible) {
        const key = p.familyId ?? `single:${p.id}`;
        const list = familyGroups.get(key) ?? [];
        list.push(p);
        familyGroups.set(key, list);
      }
      const sortedFamilies = [...familyGroups.entries()].sort((a, b) => {
        const scoreA = Math.min(
          ...a[1].map((p) => rotationSortKey(p, sector.id, index)),
        );
        const scoreB = Math.min(
          ...b[1].map((p) => rotationSortKey(p, sector.id, index)),
        );
        return scoreA - scoreB;
      });

      let picked: PersonLike[] = [];
      if (sector.unit === "person") {
        const pool = eligible.sort(
          (a, b) =>
            rotationSortKey(a, sector.id, index) -
            rotationSortKey(b, sector.id, index),
        );
        picked = pool.slice(0, 1);
      } else if (sector.unit === "family") {
        const fam = sortedFamilies.find(([, members]) => members.length >= 1);
        if (fam) {
          const available = fam[1].filter((p) => !usedPeople.has(p.id));
          picked = available.slice(0, Math.max(2, available.length));
        }
      } else {
        const fam = sortedFamilies.find(([, members]) => members.length >= 2);
        if (fam) {
          const available = fam[1].filter((p) => !usedPeople.has(p.id));
          picked = available.slice(0, Math.max(3, available.length));
        } else {
          const pool = eligible.sort(
            (a, b) =>
              rotationSortKey(a, sector.id, index) -
              rotationSortKey(b, sector.id, index),
          );
          picked = pool.slice(0, 3);
        }
      }

      for (const p of picked) usedPeople.add(p.id);
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

export function generateDraft(args: {
  type: CleaningType;
  dates: Date[];
  sectors: SectorLike[];
  people: PersonLike[];
  history: HistoryEntry[];
}): AssignmentDraft[] {
  const { type, dates, sectors, people, history } = args;
  if (type === "meeting") {
    return generateMeetingAssignments({ dates, sectors, people, history });
  }
  return generateFamilyGroupAssignments({ dates, sectors, people, history });
}
