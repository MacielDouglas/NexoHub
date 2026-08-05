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
  const subOrgId = searchParams.get("subOrgId");

  if (!subOrgId) {
    return NextResponse.json(
      { error: "subOrgId é obrigatório" },
      { status: 400 },
    );
  }

  const subOrg = await prisma.subOrganization.findFirst({
    where: { id: subOrgId, organizationId: member.organizationId },
    select: { id: true },
  });

  if (!subOrg) {
    return NextResponse.json(
      { error: "Sub-organização não encontrada" },
      { status: 404 },
    );
  }

  const people = await prisma.subOrgPerson.findMany({
    where: { subOrganizationId: subOrgId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ people });
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
      subOrgId?: string;
      name?: string;
      batizado?: boolean;
      privilegioServico?: boolean;
      talks?: { meetingContentItemId?: string; date?: string | null }[];
    };

    if (!body.subOrgId || !body.name?.trim()) {
      return NextResponse.json(
        { error: "subOrgId e name são obrigatórios" },
        { status: 400 },
      );
    }

    const subOrg = await prisma.subOrganization.findFirst({
      where: { id: body.subOrgId, organizationId: member.organizationId },
      select: { id: true },
    });

    if (!subOrg) {
      return NextResponse.json(
        { error: "Sub-organização não encontrada" },
        { status: 404 },
      );
    }

    const person = await prisma.subOrgPerson.create({
      data: {
        subOrganizationId: body.subOrgId,
        name: body.name.trim(),
        batizado: body.batizado ?? false,
        privilegioServico: body.privilegioServico ?? false,
      },
    });

    const talks = (body.talks ?? []).filter((t) => t?.meetingContentItemId);
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
      await prisma.subOrgPersonTalk.create({
        data: {
          subOrgPersonId: person.id,
          meetingContentItemId: itemId,
          date: date && !Number.isNaN(date.getTime()) ? date : null,
        },
      });
    }

    const withTalks = await prisma.subOrgPerson.findUnique({
      where: { id: person.id },
      include: {
        talks: {
          orderBy: { createdAt: "asc" },
          include: {
            meetingContentItem: { select: { id: true, data: true } },
          },
        },
      },
    });

    return NextResponse.json({ person: withTalks }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
