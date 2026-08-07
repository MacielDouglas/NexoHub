import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageSchedules, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

function validateConductorReaderConflict(
  assignments: Array<{
    role: string;
    personId?: string | null;
  }>,
): string | null {
  const byRole = new Map<string, string | null>();
  for (const a of assignments) {
    if (a.personId) byRole.set(a.role, a.personId);
  }

  const pairs: Array<[string, string]> = [
    ["condutorSentinela", "leitorSentinela"],
  ];

  const conductorRoles = [...byRole.keys()].filter((r) =>
    /^secao:\d+:\d+:condutor$/.test(r),
  );
  for (const condRole of conductorRoles) {
    const leitorRole = condRole.replace(/:condutor$/, ":leitor");
    pairs.push([condRole, leitorRole]);
  }

  for (const [cond, leitor] of pairs) {
    const condId = byRole.get(cond);
    const leitorId = byRole.get(leitor);
    if (condId && condId === leitorId) {
      return `${cond} / ${leitor}`;
    }
  }
  return null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageSchedules(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const meeting = await prisma.meeting.findFirst({
      where: { id, organizationId: member.organizationId },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Reunião não encontrada" },
        { status: 404 },
      );
    }

    const body = (await readJsonRequest(request)) as {
      assignments?: Array<{
        role: string;
        sortOrder?: number;
        personId?: string | null;
        subOrgPersonId?: string | null;
        contentItemId?: string | null;
        value?: string | null;
      }>;
      program?: Record<string, unknown> | null;
    };

    const assignments = body.assignments ?? [];

    if (!Array.isArray(assignments)) {
      return NextResponse.json(
        { error: "assignments deve ser uma lista" },
        { status: 400 },
      );
    }

    const personIds = new Set(
      assignments.map((a) => a.personId).filter((p): p is string => !!p),
    );
    const subOrgPersonIds = new Set(
      assignments.map((a) => a.subOrgPersonId).filter((p): p is string => !!p),
    );
    const contentItemIds = new Set(
      assignments.map((a) => a.contentItemId).filter((c): c is string => !!c),
    );

    if (personIds.size > 0) {
      const people = await prisma.person.findMany({
        where: {
          id: { in: [...personIds] },
          organizationId: member.organizationId,
        },
        select: { id: true },
      });
      if (people.length !== personIds.size) {
        return NextResponse.json(
          { error: "Pessoa inválida na designação" },
          { status: 400 },
        );
      }
    }

    if (subOrgPersonIds.size > 0) {
      const subOrgPeople = await prisma.subOrgPerson.findMany({
        where: {
          id: { in: [...subOrgPersonIds] },
          subOrganization: { organizationId: member.organizationId },
        },
        select: { id: true },
      });
      if (subOrgPeople.length !== subOrgPersonIds.size) {
        return NextResponse.json(
          { error: "Pessoa de sub-organização inválida na designação" },
          { status: 400 },
        );
      }
    }

    if (contentItemIds.size > 0) {
      const items = await prisma.meetingContentItem.findMany({
        where: {
          id: { in: [...contentItemIds] },
          content: { organizationId: member.organizationId },
        },
        select: { id: true },
      });
      if (items.length !== contentItemIds.size) {
        return NextResponse.json(
          { error: "Item de conteúdo inválido na designação" },
          { status: 400 },
        );
      }
    }

    const conflict = validateConductorReaderConflict(assignments);
    if (conflict) {
      return NextResponse.json(
        {
          error: `O condutor e o leitor não podem ser a mesma pessoa (${conflict})`,
        },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.meetingAssignment.deleteMany({ where: { meetingId: id } }),
      prisma.meeting.update({
        where: { id },
        data: {
          program: body.program
            ? (body.program as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        },
      }),
      ...assignments.map((a) =>
        prisma.meetingAssignment.create({
          data: {
            meetingId: id,
            role: a.role,
            sortOrder: a.sortOrder ?? 0,
            personId: a.personId ?? null,
            subOrgPersonId: a.subOrgPersonId ?? null,
            contentItemId: a.contentItemId ?? null,
            value: a.value ?? null,
          },
        }),
      ),
    ]);

    const updated = await prisma.meeting.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            person: { select: { id: true, name: true } },
            subOrgPerson: {
              select: {
                id: true,
                name: true,
                subOrganization: { select: { id: true, name: true } },
              },
            },
            contentItem: { select: { id: true, data: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json({
      meeting: {
        ...updated,
        weekStart: updated?.weekStart.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageSchedules(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id } = await params;

    const meeting = await prisma.meeting.findFirst({
      where: { id, organizationId: member.organizationId },
      select: { id: true },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: "Reunião não encontrada" },
        { status: 404 },
      );
    }

    await prisma.meeting.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
