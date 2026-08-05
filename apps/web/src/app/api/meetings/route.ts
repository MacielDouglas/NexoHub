import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageSchedules, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { parseEventDate } from "@/lib/special-events";

export async function GET(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const weekStart = parseEventDate(searchParams.get("weekStart") ?? "");

  if (!weekStart) {
    return NextResponse.json(
      { error: "weekStart é obrigatório (AAAA-MM-DD)" },
      { status: 400 },
    );
  }

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const meetings = await prisma.meeting.findMany({
    where: {
      organizationId: member.organizationId,
      weekStart: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      assignments: {
        include: {
          person: { select: { id: true, name: true } },
          contentItem: { select: { id: true, data: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ type: "asc" }, { weekStart: "asc" }],
  });

  return NextResponse.json({
    meetings: meetings.map((meeting) => ({
      ...meeting,
      weekStart: meeting.weekStart.toISOString().slice(0, 10),
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
    const body = (await readJsonRequest(request)) as {
      type?: string;
      weekStart?: string;
    };

    if (!body.type || !["midweek", "weekend", "memorial"].includes(body.type)) {
      return NextResponse.json(
        { error: "Tipo de reunião inválido" },
        { status: 400 },
      );
    }

    const weekStart = parseEventDate(body.weekStart ?? "");
    if (!weekStart) {
      return NextResponse.json(
        { error: "weekStart é obrigatório (AAAA-MM-DD)" },
        { status: 400 },
      );
    }

    const existing = await prisma.meeting.findUnique({
      where: {
        organizationId_type_weekStart: {
          organizationId: member.organizationId,
          type: body.type,
          weekStart,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma reunião para esta semana e tipo" },
        { status: 409 },
      );
    }

    const meeting = await prisma.meeting.create({
      data: {
        organizationId: member.organizationId,
        type: body.type,
        weekStart,
      },
      include: {
        assignments: {
          include: {
            person: { select: { id: true, name: true } },
            contentItem: { select: { id: true, data: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(
      {
        meeting: {
          ...meeting,
          weekStart: meeting.weekStart.toISOString().slice(0, 10),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
