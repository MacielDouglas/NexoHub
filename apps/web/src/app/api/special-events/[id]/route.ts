import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import {
  ANNUAL_EVENT_TYPES,
  isSpecialEventType,
  parseEventDate,
  SPECIAL_EVENT_FIELDS,
  serializeSpecialEvent,
} from "@/lib/special-events";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageConfig(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.specialEvent.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Evento não encontrado" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const { type, date: dateStr, endDate: endDateStr, time, location } = body;

  const nextType = type ?? existing.type;
  if (!isSpecialEventType(nextType)) {
    return NextResponse.json(
      { error: "Tipo de evento inválido" },
      { status: 400 },
    );
  }

  const nextDate = dateStr ? parseEventDate(dateStr) : existing.date;
  if (!nextDate) {
    return NextResponse.json(
      { error: "Campo obrigatório: date (AAAA-MM-DD)" },
      { status: 400 },
    );
  }

  const fields = SPECIAL_EVENT_FIELDS[nextType];
  let nextEndDate: Date | null =
    endDateStr !== undefined ? parseEventDate(endDateStr) : existing.endDate;
  if (fields.endDate) {
    if (!nextEndDate) {
      return NextResponse.json(
        { error: "Campo obrigatório: endDate (AAAA-MM-DD)" },
        { status: 400 },
      );
    }
    if (nextEndDate < nextDate) {
      return NextResponse.json(
        { error: "endDate deve ser igual ou posterior a date" },
        { status: 400 },
      );
    }
  } else {
    nextEndDate = null;
  }

  const nextTime = time !== undefined ? (time as string) : existing.time;
  if (fields.time && !nextTime) {
    return NextResponse.json(
      { error: "Campo obrigatório: time" },
      { status: 400 },
    );
  }

  const nextLocation =
    location !== undefined ? (location as string) : existing.location;
  if (fields.location && !nextLocation) {
    return NextResponse.json(
      { error: "Campo obrigatório: location" },
      { status: 400 },
    );
  }

  if (
    nextType !== existing.type ||
    nextDate.getFullYear() !== existing.date.getFullYear()
  ) {
    if ((ANNUAL_EVENT_TYPES as readonly string[]).includes(nextType)) {
      const duplicate = await prisma.specialEvent.findFirst({
        where: {
          organizationId: member.organizationId,
          type: nextType,
          id: { not: id },
          date: {
            gte: new Date(nextDate.getFullYear(), 0, 1),
            lt: new Date(nextDate.getFullYear() + 1, 0, 1),
          },
        },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            error: `Já existe um evento "${nextType}" em ${nextDate.getFullYear()}`,
          },
          { status: 409 },
        );
      }
    }
  }

  const event = await prisma.specialEvent.update({
    where: { id },
    data: {
      type: nextType,
      date: nextDate,
      endDate: nextEndDate,
      time: fields.time ? nextTime : null,
      location: fields.location ? nextLocation : null,
    },
  });

  return NextResponse.json({ event: serializeSpecialEvent(event) });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageConfig(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.specialEvent.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Evento não encontrado" },
      { status: 404 },
    );
  }

  await prisma.specialEvent.delete({ where: { id } });

  return NextResponse.json({ message: "Evento removido" });
}
