import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  OverviewClient,
  type OverviewItem,
} from "@/features/overview/overview-client";
import { auth } from "@/lib/auth";
import {
  addDays,
  parseDateKey,
  startOfDay,
  startOfWeek,
  toDateKey,
} from "@/lib/cleaning-assignment";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

type OrganizationPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const MEETING_ROLE_KEYS: Record<string, string> = {
  presidente: "meetings.roles.presidente",
  canticoInicial: "meetings.roles.canticoInicial",
  cancionMedia: "meetings.roles.canticoMeio",
  canticoMeio: "meetings.roles.canticoMeio",
  canticoFinal: "meetings.roles.canticoFinal",
  canticoFinalOracao: "meetings.roles.canticoFinalOracao",
  palavrasIntroducao: "meetings.roles.palavrasIntroducao",
  palavrasConclusao: "meetings.roles.palavrasConclusao",
  discurso: "meetings.roles.discurso",
  orador: "meetings.roles.orador",
  passarPao: "meetings.roles.passarPao",
  passarVinho: "meetings.roles.passarVinho",
  indicador: "meetings.roles.indicador",
  condutor: "meetings.roles.condutor",
  condutorSentinela: "meetings.roles.condutor",
  leitor: "meetings.roles.leitor",
  leitorSentinela: "meetings.roles.leitor",
  oracao: "meetings.roles.oracao",
};

type CleaningRow = {
  id: string;
  date: Date;
  sector: {
    type: string;
    name: string | null;
    defaultKey: string | null;
  };
};

function buildCleaningItem(a: CleaningRow): OverviewItem {
  return {
    id: a.id,
    kind: "cleaning",
    date: toDateKey(a.date),
    titleKey: a.sector.defaultKey
      ? `cleaning.defaults.${a.sector.type}.${a.sector.defaultKey}.name`
      : null,
    title: a.sector.defaultKey ? null : a.sector.name,
    subtitleKey: `cleaning.types.${a.sector.type}`,
    subtitle: null,
  };
}

export default async function OrganizationPage({
  params,
}: OrganizationPageProps) {
  const { slug: _slug } = await params;

  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const member = await getUserOrg(await headers());

  if (!member) {
    if (session.user.globalRole === "super_user") {
      redirect("/admin");
    }
    if (session.user.globalRole === "owner") {
      redirect("/create-org");
    }
    redirect("/welcome");
  }

  const today = startOfDay(new Date());
  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [person, configs, events] = await Promise.all([
    prisma.person.findFirst({
      where: {
        organizationId: member.organizationId,
        userId: session.user.id,
      },
      select: { id: true, name: true },
    }),
    prisma.meetingConfig.findMany({
      where: { organizationId: member.organizationId, isActive: true },
      select: { type: true, dayOfWeek: true, startTime: true },
    }),
    prisma.specialEvent.findMany({
      where: { organizationId: member.organizationId },
      select: { type: true, date: true, endDate: true, time: true },
    }),
  ]);

  const meetingByType = new Map(configs.map((c) => [c.type, c]));

  function derivedMeetingDate(type: string, weekStartDate: Date): Date {
    const config = meetingByType.get(type);
    if (!config) return weekStartDate;
    return addDays(weekStartDate, (config.dayOfWeek + 6) % 7);
  }

  const upcoming: OverviewItem[] = [];
  const pastMonth: OverviewItem[] = [];

  let weekAssignments: OverviewItem[] = [];

  if (person) {
    const [weekMeetings, designationAssignments, cleaningAssignments] =
      await Promise.all([
        prisma.meeting.findMany({
          where: {
            organizationId: member.organizationId,
            weekStart: { gte: weekStart, lte: weekEnd },
          },
          select: {
            id: true,
            type: true,
            weekStart: true,
            assignments: {
              where: { personId: person.id },
              select: { id: true, role: true },
            },
          },
        }),
        prisma.designationAssignment.findMany({
          where: {
            personId: person.id,
            date: { gte: monthStart },
          },
          select: { id: true, date: true, role: true, sector: true },
          orderBy: { date: "asc" },
        }),
        prisma.cleaningAssignment.findMany({
          where: {
            personId: person.id,
            date: { gte: monthStart },
          },
          select: {
            id: true,
            date: true,
            sector: {
              select: { type: true, name: true, defaultKey: true },
            },
          },
          orderBy: { date: "asc" },
        }),
      ]);

    const meetingItems: OverviewItem[] = weekMeetings.flatMap((meeting) => {
      const meetingDate = toDateKey(
        derivedMeetingDate(meeting.type, meeting.weekStart),
      );
      return meeting.assignments.map((a) => ({
        id: a.id,
        kind: "meeting" as const,
        date: meetingDate,
        titleKey: MEETING_ROLE_KEYS[a.role] ?? null,
        title: MEETING_ROLE_KEYS[a.role] ? null : a.role,
        subtitleKey: `meetings.types.${meeting.type}`,
        subtitle: null,
      }));
    });

    const cleaningItems = cleaningAssignments.map(buildCleaningItem);

    const weekCleaningItems = cleaningItems.filter(
      (item) =>
        item.date >= toDateKey(weekStart) && item.date <= toDateKey(weekEnd),
    );
    weekAssignments = [...meetingItems, ...weekCleaningItems].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    for (const a of designationAssignments) {
      const item: OverviewItem = {
        id: a.id,
        kind: "designation",
        date: toDateKey(a.date),
        titleKey: `designations.roles.${a.role}`,
        title: null,
        subtitleKey: null,
        subtitle: a.sector ?? null,
      };
      if (startOfDay(a.date) >= today) {
        upcoming.push(item);
      } else {
        pastMonth.push(item);
      }
    }

    for (const item of cleaningItems) {
      if (startOfDay(parseDateKey(item.date)) >= today) {
        upcoming.push(item);
      } else {
        pastMonth.push(item);
      }
    }

    upcoming.sort((a, b) => a.date.localeCompare(b.date));
    pastMonth.sort((a, b) => b.date.localeCompare(a.date));
  }

  const memorialEvent = events.find((e) => e.type === "memorial");
  const midweekConfig = meetingByType.get("midweek");
  const weekendConfig = meetingByType.get("weekend");

  const derivedMeetings: { type: string; date: Date }[] = [];
  if (memorialEvent) {
    const memorialDay = startOfDay(memorialEvent.date);
    const isWeekend = memorialDay.getDay() === 0 || memorialDay.getDay() === 6;
    if (midweekConfig && isWeekend) {
      derivedMeetings.push({
        type: "midweek",
        date: derivedMeetingDate("midweek", weekStart),
      });
    }
    if (weekendConfig && !isWeekend) {
      derivedMeetings.push({
        type: "weekend",
        date: derivedMeetingDate("weekend", weekStart),
      });
    }
    derivedMeetings.push({ type: "memorial", date: memorialDay });
  } else {
    if (midweekConfig) {
      derivedMeetings.push({
        type: "midweek",
        date: derivedMeetingDate("midweek", weekStart),
      });
    }
    if (weekendConfig) {
      derivedMeetings.push({
        type: "weekend",
        date: derivedMeetingDate("weekend", weekStart),
      });
    }
  }

  const next =
    derivedMeetings
      .filter((m) => m.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;

  const nextMeeting = next
    ? {
        type: next.type,
        date: toDateKey(next.date),
        time:
          (next.type === "memorial"
            ? events.find((e) => e.type === "memorial")?.time
            : meetingByType.get(next.type)?.startTime) ?? "",
      }
    : null;

  return (
    <OverviewClient
      personName={person?.name ?? null}
      weekStart={toDateKey(weekStart)}
      weekEnd={toDateKey(weekEnd)}
      today={toDateKey(today)}
      nextMeeting={nextMeeting}
      weekAssignments={weekAssignments}
      upcoming={upcoming}
      pastMonth={pastMonth}
    />
  );
}
