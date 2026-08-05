import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { parseDateKey, toDateKey } from "@/lib/cleaning-assignment";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageSchedules, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { cleaningScheduleUpdateSchema } from "@/lib/schemas";

type Params = Promise<{ id: string }>;

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

export async function PUT(request: Request, { params }: { params: Params }) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageSchedules(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.cleaningSchedule.findFirst({
    where: { id, organizationId: member.organizationId },
    include: { assignments: { select: { id: true } } },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Programação não encontrada" },
      { status: 404 },
    );
  }

  try {
    const body = cleaningScheduleUpdateSchema.parse(
      await readJsonRequest(request),
    );
    const dates = body.dates
      .map(parseDateKey)
      .sort((a, b) => a.getTime() - b.getTime());

    const config = await prisma.cleaningConfig.findUnique({
      where: { organizationId: member.organizationId },
      include: { sectors: { select: { id: true, type: true } } },
    });

    const allowedSectors = new Set(
      (config?.sectors ?? [])
        .filter((s) => s.type === existing.type)
        .map((s) => s.id),
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

    const updated = await prisma.$transaction(async (tx) => {
      await tx.cleaningAssignment.deleteMany({ where: { scheduleId: id } });
      return tx.cleaningSchedule.update({
        where: { id },
        data: {
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
    });

    return NextResponse.json({
      schedule: {
        id: updated.id,
        type: updated.type,
        startDate: toDateKey(updated.startDate),
        endDate: toDateKey(updated.endDate),
        createdAt: updated.createdAt.toISOString(),
        assignments: updated.assignments.map(serializeAssignment),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageSchedules(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.cleaningSchedule.findFirst({
    where: { id, organizationId: member.organizationId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Programação não encontrada" },
      { status: 404 },
    );
  }

  await prisma.cleaningSchedule.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
