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

export async function GET() {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const events = await prisma.specialEvent.findMany({
    where: { organizationId: member.organizationId },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ events: events.map(serializeSpecialEvent) });
}

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageConfig(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const { type, date: dateStr, endDate: endDateStr, time, location } = body;

  if (!isSpecialEventType(type)) {
    return NextResponse.json(
      { error: "Tipo de evento inválido" },
      { status: 400 },
    );
  }

  const date = parseEventDate(dateStr);
  if (!date) {
    return NextResponse.json(
      { error: "Campo obrigatório: date (AAAA-MM-DD)" },
      { status: 400 },
    );
  }

  const fields = SPECIAL_EVENT_FIELDS[type];
  let endDate: Date | null = null;
  if (fields.endDate) {
    endDate = endDateStr ? parseEventDate(endDateStr) : null;
    if (!endDate) {
      return NextResponse.json(
        { error: "Campo obrigatório: endDate (AAAA-MM-DD)" },
        { status: 400 },
      );
    }
    if (endDate < date) {
      return NextResponse.json(
        { error: "endDate deve ser igual ou posterior a date" },
        { status: 400 },
      );
    }
  }

  if (fields.time && !time) {
    return NextResponse.json(
      { error: "Campo obrigatório: time" },
      { status: 400 },
    );
  }

  if (fields.location && !location) {
    return NextResponse.json(
      { error: "Campo obrigatório: location" },
      { status: 400 },
    );
  }

  if ((ANNUAL_EVENT_TYPES as readonly string[]).includes(type)) {
    const existing = await prisma.specialEvent.findFirst({
      where: {
        organizationId: member.organizationId,
        type,
        date: {
          gte: new Date(date.getFullYear(), 0, 1),
          lt: new Date(date.getFullYear() + 1, 0, 1),
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Já existe um evento "${type}" em ${date.getFullYear()}` },
        { status: 409 },
      );
    }
  }

  const event = await prisma.specialEvent.create({
    data: {
      organizationId: member.organizationId,
      type,
      date,
      endDate,
      time,
      location,
    },
  });

  return NextResponse.json(
    { event: serializeSpecialEvent(event) },
    { status: 201 },
  );
}
