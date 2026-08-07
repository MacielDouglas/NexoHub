import {
  addDays,
  eachDayInRange,
  isSameDay,
  type MeetingConfigLike,
  parseDateKey,
  type SpecialEventLike,
  startOfWeek,
  toDateKey,
} from "@/lib/cleaning-assignment";

export type DesignationRole = "som" | "video" | "palco" | "mic" | "indicador";

export const DESIGNATION_ROLES: DesignationRole[] = [
  "som",
  "video",
  "palco",
  "mic",
  "indicador",
];

export const ROLE_PRIVILEGE: Record<DesignationRole, string> = {
  som: "som",
  video: "video",
  palco: "palco",
  mic: "microfoneVolante",
  indicador: "indicador",
};

export type SkippedReason =
  | "convention"
  | "assemblyTraveling"
  | "assemblyRepresentative"
  | "memorial"
  | "already_has_program";

export type DesignationPerson = {
  id: string;
  name: string;
  sex: string;
  active: boolean;
  som: boolean;
  video: boolean;
  palco: boolean;
  microfoneVolante: boolean;
  indicador: boolean;
};

export type DesignationHistoryEntry = {
  date: Date;
  personId: string;
  role: DesignationRole;
};

export type DateRestriction = {
  blockAll: Set<string>;
  blockMic: Set<string>;
};

export type DesignationDraftEntry = {
  date: string;
  role: DesignationRole;
  sector: string | null;
  personId: string;
};

export function weekBlockingEventType(
  date: Date,
  events: SpecialEventLike[],
): SkippedReason | null {
  const weekStart = startOfWeek(date);
  const weekEnd = addDays(weekStart, 6);
  for (const ev of events) {
    if (
      ev.type !== "convention" &&
      ev.type !== "assemblyTraveling" &&
      ev.type !== "assemblyRepresentative"
    ) {
      continue;
    }
    const start = parseDateKey(ev.date);
    const end = ev.endDate ? parseDateKey(ev.endDate) : start;
    if (end >= weekStart && start <= weekEnd) {
      return ev.type as SkippedReason;
    }
  }
  return null;
}

export function memorialOnDate(
  date: Date,
  events: SpecialEventLike[],
): boolean {
  return events.some(
    (ev) => ev.type === "memorial" && isSameDay(parseDateKey(ev.date), date),
  );
}

export function computeDesignationDates(args: {
  start: Date;
  end: Date;
  configs: MeetingConfigLike[];
  events: SpecialEventLike[];
  occupiedDates: Set<string>;
}): { included: Date[]; skipped: { date: Date; reason: SkippedReason }[] } {
  const { start, end, configs, events, occupiedDates } = args;
  const activeDays = new Set(
    configs.filter((c) => c.isActive).map((c) => c.dayOfWeek),
  );

  const included: Date[] = [];
  const skipped: { date: Date; reason: SkippedReason }[] = [];

  for (const date of eachDayInRange(start, end)) {
    if (!activeDays.has(date.getDay())) continue;

    const blocking = weekBlockingEventType(date, events);
    if (blocking) {
      skipped.push({ date, reason: blocking });
      continue;
    }

    if (memorialOnDate(date, events)) {
      skipped.push({ date, reason: "memorial" });
      continue;
    }

    if (occupiedDates.has(toDateKey(date))) {
      skipped.push({ date, reason: "already_has_program" });
      continue;
    }

    included.push(date);
  }

  return { included, skipped };
}

function rotationSortKey(
  personId: string,
  role: DesignationRole,
  index: {
    lastAssigned: Map<string, Map<DesignationRole, number>>;
    lastAny: Map<string, number>;
  },
): number {
  const roleMap = index.lastAssigned.get(personId);
  const roleLast = roleMap?.get(role);
  if (roleLast !== undefined) return roleLast;
  const anyLast = index.lastAny.get(personId);
  return anyLast ?? -Infinity;
}

export function generateDesignations(args: {
  dates: Date[];
  people: DesignationPerson[];
  enabledSectors: DesignationRole[];
  micCount: number;
  indicadorCount: number;
  indicadorSectors: string[];
  history: DesignationHistoryEntry[];
  restrictions: Map<string, DateRestriction>;
}): DesignationDraftEntry[] {
  const {
    dates,
    people,
    enabledSectors,
    micCount,
    indicadorCount,
    indicadorSectors,
    history,
    restrictions,
  } = args;

  const index: {
    lastAssigned: Map<string, Map<DesignationRole, number>>;
    lastAny: Map<string, number>;
  } = { lastAssigned: new Map(), lastAny: new Map() };

  for (const entry of history) {
    const ts = entry.date.getTime();
    let roleMap = index.lastAssigned.get(entry.personId);
    if (!roleMap) {
      roleMap = new Map();
      index.lastAssigned.set(entry.personId, roleMap);
    }
    const prev = roleMap.get(entry.role);
    if (prev === undefined || ts > prev) roleMap.set(entry.role, ts);
    const prevAny = index.lastAny.get(entry.personId);
    if (prevAny === undefined || ts > prevAny) {
      index.lastAny.set(entry.personId, ts);
    }
  }

  const roleSlots: { role: DesignationRole; count: number }[] =
    DESIGNATION_ROLES.filter((role) => enabledSectors.includes(role)).map(
      (role) => ({
        role,
        count:
          role === "mic" ? micCount : role === "indicador" ? indicadorCount : 1,
      }),
    );

  const entries: DesignationDraftEntry[] = [];
  const sortedDates = dates.slice().sort((a, b) => a.getTime() - b.getTime());

  for (const date of sortedDates) {
    const dateKey = toDateKey(date);
    const ts = date.getTime();
    const restriction = restrictions.get(dateKey);
    const used = new Set(restriction?.blockAll ?? []);

    const pick = (role: DesignationRole, needed: number): string[] => {
      if (needed <= 0) return [];
      const privilege = ROLE_PRIVILEGE[role];
      const pool = people
        .filter(
          (p) =>
            p.active &&
            p.sex === "MALE" &&
            p[privilege as keyof DesignationPerson] === true &&
            !used.has(p.id) &&
            (role !== "mic" || !restriction?.blockMic.has(p.id)),
        )
        .sort(
          (a, b) =>
            rotationSortKey(a.id, role, index) -
              rotationSortKey(b.id, role, index) ||
            a.name.localeCompare(b.name),
        );
      return pool.slice(0, needed).map((p) => p.id);
    };

    const markUsed = (personId: string, role: DesignationRole) => {
      used.add(personId);
      let roleMap = index.lastAssigned.get(personId);
      if (!roleMap) {
        roleMap = new Map();
        index.lastAssigned.set(personId, roleMap);
      }
      roleMap.set(role, ts);
      index.lastAny.set(personId, ts);
    };

    for (const { role, count } of roleSlots) {
      if (role === "indicador") {
        for (let i = 0; i < count; i++) {
          const picked = pick("indicador", 1);
          if (picked.length === 0) break;
          const personId = picked[0];
          markUsed(personId, "indicador");
          entries.push({
            date: dateKey,
            role: "indicador",
            sector: indicadorSectors[i] ?? null,
            personId,
          });
        }
        continue;
      }

      const picked = pick(role, count);
      for (const personId of picked) {
        markUsed(personId, role);
        entries.push({
          date: dateKey,
          role,
          sector: null,
          personId,
        });
      }
    }
  }

  return entries;
}

export function buildDateRestrictions(args: {
  meetings: Array<{
    type: string;
    weekStart: string;
    assignments: Array<{ role: string; personId: string | null }>;
  }>;
  configs: MeetingConfigLike[];
}): Map<string, DateRestriction> {
  const { meetings, configs } = args;
  const result = new Map<string, DateRestriction>();

  const meetingDate = (type: string, weekStart: string): string => {
    const ws = parseDateKey(weekStart);
    const cfg = configs.find((c) => c.type === type && c.isActive);
    const day = cfg?.dayOfWeek ?? (type === "midweek" ? 2 : 0);
    return toDateKey(addDays(ws, (day + 6) % 7));
  };

  for (const meeting of meetings) {
    if (meeting.type !== "midweek" && meeting.type !== "weekend") continue;
    const dateKey = meetingDate(meeting.type, meeting.weekStart);
    const restriction = result.get(dateKey) ?? {
      blockAll: new Set<string>(),
      blockMic: new Set<string>(),
    };

    for (const a of meeting.assignments) {
      if (!a.personId) continue;
      if (meeting.type === "midweek") {
        if (a.role === "presidente") {
          restriction.blockAll.add(a.personId);
        } else if (/^secao:\d+:\d+:condutor$/.test(a.role)) {
          restriction.blockMic.add(a.personId);
        }
      } else {
        if (a.role === "condutorSentinela") {
          restriction.blockAll.add(a.personId);
        } else if (a.role === "leitorSentinela") {
          restriction.blockMic.add(a.personId);
        }
      }
    }

    result.set(dateKey, restriction);
  }

  return result;
}
