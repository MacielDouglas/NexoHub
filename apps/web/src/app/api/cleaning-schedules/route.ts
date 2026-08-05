import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  type CleaningType,
  parseDateKey,
  toDateKey,
  validateDatesForType,
} from "@/lib/cleaning-assignment";
import { getOrCreateCleaningConfig } from "@/lib/cleaning-config";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageSchedules, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { cleaningScheduleCreateSchema } from "@/lib/schemas";

function serializeAssignment(a: {
  id: string;
  date: Date;
  sectorId: string;
  personId: string;
  sector: { id: string; name: string | null; defaultKey: string | null };
  person: { id: string; name: string };
}) {
  return {
    id: a.id,
    date: toDateKey(a.date),
    sectorId: a.sectorId,
    personId: a.personId,
    sectorName: a.sector.name,
    sectorDefaultKey: a.sector.defaultKey,
    personName: a.person.name,
  };
}

export async function GET() {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const schedules = await prisma.cleaningSchedule.findMany({
    where: { organizationId: member.organizationId },
    include: {
      assignments: {
        include: {
          sector: { select: { id: true, name: true, defaultKey: true } },
          person: { select: { id: true, name: true } },
        },
        orderBy: { date: "asc" },
      },
    },
    orderBy: [{ startDate: "desc" }],
  });

  return NextResponse.json({
    schedules: schedules.map((s) => ({
      id: s.id,
      type: s.type,
      startDate: toDateKey(s.startDate),
      endDate: toDateKey(s.endDate),
      createdAt: s.createdAt.toISOString(),
      assignments: s.assignments.map(serializeAssignment),
    })),
  });
}

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageSchedules(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = cleaningScheduleCreateSchema.parse(
      await readJsonRequest(request),
    );
    const type = body.type as CleaningType;
    const dates = body.dates
      .map(parseDateKey)
      .sort((a, b) => a.getTime() - b.getTime());

    const config = await getOrCreateCleaningConfig(member.organizationId);

    const [existingSchedules, events, meetingConfigs] = await Promise.all([
      prisma.cleaningSchedule.findMany({
        where: { organizationId: member.organizationId },
        include: { assignments: { select: { date: true } } },
      }),
      prisma.specialEvent.findMany({
        where: { organizationId: member.organizationId },
        select: { type: true, date: true, endDate: true },
      }),
      prisma.meetingConfig.findMany({
        where: { organizationId: member.organizationId },
        select: { type: true, dayOfWeek: true, isActive: true },
      }),
    ]);

    const conflict = validateDatesForType({
      type,
      dates,
      existingSchedules: existingSchedules.map((s) => ({
        id: s.id,
        type: s.type as CleaningType,
        assignments: s.assignments,
      })),
      events: events.map((e) => ({
        type: e.type,
        date: toDateKey(e.date),
        endDate: e.endDate ? toDateKey(e.endDate) : null,
      })),
    });
    void meetingConfigs;
    if (conflict) {
      return NextResponse.json({ error: conflict }, { status: 409 });
    }

    const allowedSectors = new Set(
      config.sectors.filter((s) => s.type === type).map((s) => s.id),
    );
    const personIds = [
      ...new Set(body.assignments.flatMap((a) => a.personIds)),
    ];
    const people = await prisma.person.findMany({
      where: { id: { in: personIds }, organizationId: member.organizationId },
      select: { id: true },
    });
    const allowedPeople = new Set(people.map((p) => p.id));

    for (const assignment of body.assignments) {
      if (!allowedSectors.has(assignment.sectorId)) {
        return NextResponse.json({ error: "Setor inválido" }, { status: 400 });
      }
      for (const pid of assignment.personIds) {
        if (!allowedPeople.has(pid)) {
          return NextResponse.json(
            { error: "Pessoa inválida" },
            { status: 400 },
          );
        }
      }
    }

    const created = await prisma.cleaningSchedule.create({
      data: {
        organizationId: member.organizationId,
        type,
        startDate: dates[0],
        endDate: dates[dates.length - 1],
        assignments: {
          create: body.assignments.flatMap((a) =>
            a.personIds.map((pid) => ({
              date: parseDateKey(a.date),
              sectorId: a.sectorId,
              personId: pid,
            })),
          ),
        },
      },
      include: {
        assignments: {
          include: {
            sector: { select: { id: true, name: true, defaultKey: true } },
            person: { select: { id: true, name: true } },
          },
          orderBy: { date: "asc" },
        },
      },
    });

    return NextResponse.json(
      {
        schedule: {
          id: created.id,
          type: created.type,
          startDate: toDateKey(created.startDate),
          endDate: toDateKey(created.endDate),
          createdAt: created.createdAt.toISOString(),
          assignments: created.assignments.map(serializeAssignment),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
