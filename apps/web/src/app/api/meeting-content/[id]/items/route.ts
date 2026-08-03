import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { itemDataSchema } from "@/lib/content-validation";
import { handleApiError, readJsonRequest } from "@/lib/http";
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

  try {
    const { id } = await params;

    const content = await prisma.meetingContent.findFirst({
      where: { id, organizationId: member.organizationId },
      select: { id: true, type: true },
    });

    if (!content) {
      return NextResponse.json(
        { error: "Conteúdo não encontrado" },
        { status: 404 },
      );
    }

    const body = await readJsonRequest(request);
    const parsed = itemDataSchema(content.type).safeParse(
      (body as { data?: unknown })?.data,
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados do item inválidos" },
        { status: 422 },
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
        data: parsed.data as object,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
