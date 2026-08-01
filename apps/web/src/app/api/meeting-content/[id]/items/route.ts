import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
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

  const { data } = await request.json();

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Dados do item obrigatórios" },
      { status: 400 },
    );
  }

  const last = await prisma.meetingContentItem.findFirst({
    where: { contentId: id },
    orderBy: { position: "desc" },
  });

  const item = await prisma.meetingContentItem.create({
    data: {
      contentId: id,
      position: (last?.position ?? -1) + 1,
      data: data as object,
    },
  });

  return NextResponse.json({ item }, { status: 201 });
}
