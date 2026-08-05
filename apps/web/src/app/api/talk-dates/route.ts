import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

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
      personTalkId?: string;
      date?: string;
    };

    if (!body.personTalkId || !body.date) {
      return NextResponse.json(
        { error: "personTalkId e date são obrigatórios" },
        { status: 400 },
      );
    }

    const talk = await prisma.personTalk.findFirst({
      where: {
        id: body.personTalkId,
        person: { organizationId: member.organizationId },
      },
      select: { id: true },
    });

    if (!talk) {
      return NextResponse.json(
        { error: "Discurso não encontrado" },
        { status: 404 },
      );
    }

    const date = new Date(body.date);
    if (Number.isNaN(date.getTime())) {
      return NextResponse.json({ error: "Data inválida" }, { status: 400 });
    }

    const created = await prisma.talkDate.create({
      data: { personTalkId: talk.id, date },
    });

    return NextResponse.json({ date: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
