import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export const MEETING_CONTENT_TYPES = [
  "apostila",
  "sentinela",
  "discursos",
  "canticos",
] as const;

export type MeetingContentType = (typeof MEETING_CONTENT_TYPES)[number];

export async function GET(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const includeItems = searchParams.get("includeItems") === "1";

  const contents = await prisma.meetingContent.findMany({
    where: {
      organizationId: member.organizationId,
      ...(type && MEETING_CONTENT_TYPES.includes(type as never)
        ? { type }
        : {}),
    },
    orderBy: [{ issue: "desc" }, { createdAt: "desc" }],
    include: {
      ...(includeItems
        ? { items: { orderBy: { position: "asc" } } }
        : { _count: { select: { items: true } } }),
    },
  });

  return NextResponse.json({ contents });
}

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { type, title, symbol, coverTitle } = await request.json();

  if (!type || !MEETING_CONTENT_TYPES.includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const content = await prisma.meetingContent.create({
    data: {
      organizationId: member.organizationId,
      type,
      title: title ?? "",
      symbol: symbol ?? null,
      coverTitle: coverTitle ?? null,
    },
  });

  return NextResponse.json({ content }, { status: 201 });
}

export async function DELETE(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type || !MEETING_CONTENT_TYPES.includes(type as never)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const { count } = await prisma.meetingContent.deleteMany({
    where: {
      organizationId: member.organizationId,
      type,
    },
  });

  return NextResponse.json({ count });
}
