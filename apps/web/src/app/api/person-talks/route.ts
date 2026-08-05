import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const personId = searchParams.get("personId");

  const talks = await prisma.personTalk.findMany({
    where: {
      person: { organizationId: member.organizationId },
      ...(personId ? { personId } : {}),
    },
    include: {
      person: { select: { id: true, name: true } },
      meetingContentItem: {
        select: { id: true, data: true },
      },
      dates: { orderBy: { date: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ talks });
}

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = (await readJsonRequest(request)) as {
      personId?: string;
      meetingContentItemId?: string;
      date?: string | null;
    };

    if (!body.personId || !body.meetingContentItemId) {
      return NextResponse.json(
        { error: "personId e meetingContentItemId são obrigatórios" },
        { status: 400 },
      );
    }

    const person = await prisma.person.findFirst({
      where: {
        id: body.personId,
        organizationId: member.organizationId,
      },
      select: { id: true },
    });

    if (!person) {
      return NextResponse.json(
        { error: "Pessoa não encontrada" },
        { status: 404 },
      );
    }

    const item = await prisma.meetingContentItem.findFirst({
      where: {
        id: body.meetingContentItemId,
        content: {
          organizationId: member.organizationId,
          type: "discursos",
        },
      },
      select: { id: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Discurso não encontrado" },
        { status: 404 },
      );
    }

    const talk = await prisma.personTalk.upsert({
      where: {
        personId_meetingContentItemId: {
          personId: body.personId,
          meetingContentItemId: body.meetingContentItemId,
        },
      },
      update: {},
      create: {
        personId: body.personId,
        meetingContentItemId: body.meetingContentItemId,
      },
      include: {
        meetingContentItem: { select: { id: true, data: true } },
        dates: true,
      },
    });

    if (body.date) {
      const date = new Date(body.date);
      if (!Number.isNaN(date.getTime())) {
        await prisma.talkDate.create({
          data: { personTalkId: talk.id, date },
        });
      }
    }

    const refreshed = await prisma.personTalk.findUnique({
      where: { id: talk.id },
      include: {
        meetingContentItem: { select: { id: true, data: true } },
        dates: { orderBy: { date: "desc" } },
      },
    });

    return NextResponse.json({ talk: refreshed }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
