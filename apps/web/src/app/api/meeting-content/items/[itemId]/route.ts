import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { itemId } = await params;

  const item = await prisma.meetingContentItem.findFirst({
    where: { id: itemId, content: { organizationId: member.organizationId } },
  });

  if (!item) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  const { data, position } = await request.json();

  const updated = await prisma.meetingContentItem.update({
    where: { id: itemId },
    data: {
      ...(data !== undefined && { data: data as object }),
      ...(position !== undefined && { position }),
    },
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { itemId } = await params;

  const item = await prisma.meetingContentItem.findFirst({
    where: { id: itemId, content: { organizationId: member.organizationId } },
  });

  if (!item) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  await prisma.meetingContentItem.delete({ where: { id: itemId } });

  return NextResponse.json({ message: "Item removido" });
}
