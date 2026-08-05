import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function PUT(request: Request, { params }: { params: Params }) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = (await readJsonRequest(request)) as {
      name?: string;
      batizado?: boolean;
      privilegioServico?: boolean;
      talks?: { meetingContentItemId?: string; date?: string | null }[];
    };

    const existing = await prisma.subOrgPerson.findFirst({
      where: { id, subOrganization: { organizationId: member.organizationId } },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pessoa não encontrada" },
        { status: 404 },
      );
    }

    await prisma.subOrgPerson.update({
      where: { id },
      data: {
        ...(body.name?.trim() && { name: body.name.trim() }),
        ...(body.batizado !== undefined && { batizado: body.batizado }),
        ...(body.privilegioServico !== undefined && {
          privilegioServico: body.privilegioServico,
        }),
      },
    });

    if (body.talks !== undefined) {
      const talks = body.talks.filter((t) => t?.meetingContentItemId);

      const current = await prisma.subOrgPersonTalk.findMany({
        where: { subOrgPersonId: id },
        select: { id: true, meetingContentItemId: true },
      });
      const currentByItem = new Map(
        current.map((c) => [c.meetingContentItemId, c]),
      );
      const wantedItemIds = new Set(
        talks.map((t) => t.meetingContentItemId as string),
      );

      for (const c of current) {
        if (!wantedItemIds.has(c.meetingContentItemId)) {
          await prisma.subOrgPersonTalk.delete({ where: { id: c.id } });
        }
      }

      for (const talk of talks) {
        const itemId = talk.meetingContentItemId as string;
        const item = await prisma.meetingContentItem.findFirst({
          where: {
            id: itemId,
            content: {
              organizationId: member.organizationId,
              type: "discursos",
            },
          },
          select: { id: true },
        });
        if (!item) continue;

        const date = talk.date ? new Date(talk.date) : null;
        const parsedDate = date && !Number.isNaN(date.getTime()) ? date : null;

        const existingTalk = currentByItem.get(itemId);
        if (existingTalk) {
          await prisma.subOrgPersonTalk.update({
            where: { id: existingTalk.id },
            data: { date: parsedDate },
          });
        } else {
          await prisma.subOrgPersonTalk.create({
            data: {
              subOrgPersonId: id,
              meetingContentItemId: itemId,
              date: parsedDate,
            },
          });
        }
      }
    }

    const withTalks = await prisma.subOrgPerson.findUnique({
      where: { id },
      include: {
        talks: {
          orderBy: { createdAt: "asc" },
          include: {
            meetingContentItem: { select: { id: true, data: true } },
          },
        },
      },
    });

    return NextResponse.json({ person: withTalks });
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

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.subOrgPerson.findFirst({
    where: { id, subOrganization: { organizationId: member.organizationId } },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Pessoa não encontrada" },
      { status: 404 },
    );
  }

  await prisma.subOrgPerson.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
