import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { meetingContentUpdateSchema } from "@/lib/schemas";

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

  try {
    const body = meetingContentUpdateSchema.parse(
      await readJsonRequest(request),
    );

    const updated = await prisma.meetingContent.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.symbol !== undefined && { symbol: body.symbol }),
        ...(body.coverTitle !== undefined && { coverTitle: body.coverTitle }),
      },
    });

    return NextResponse.json({ content: updated });
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
