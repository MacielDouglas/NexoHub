import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const content = await prisma.meetingContent.findFirst({
    where: { id, organizationId: member.organizationId },
    include: { items: { orderBy: { position: "asc" } } },
  });

  if (!content) {
    return NextResponse.json(
      { error: "Conteúdo não encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({ content });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const content = await prisma.meetingContent.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!content) {
    return NextResponse.json(
      { error: "Conteúdo não encontrado" },
      { status: 404 },
    );
  }

  const { title, symbol, coverTitle } = await request.json();

  const updated = await prisma.meetingContent.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(symbol !== undefined && { symbol }),
      ...(coverTitle !== undefined && { coverTitle }),
    },
  });

  return NextResponse.json({ content: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const content = await prisma.meetingContent.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!content) {
    return NextResponse.json(
      { error: "Conteúdo não encontrado" },
      { status: 404 },
    );
  }

  await prisma.meetingContent.delete({ where: { id } });

  return NextResponse.json({ message: "Conteúdo removido" });
}
