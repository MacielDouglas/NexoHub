import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { itemDataSchema } from "@/lib/content-validation";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

const itemUpdateSchema = z
  .object({
    data: z.unknown().optional(),
    position: z.number().int().min(0).max(1_000_000).optional(),
  })
  .strict();

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

  try {
    const { itemId } = await params;

    const item = await prisma.meetingContentItem.findFirst({
      where: { id: itemId, content: { organizationId: member.organizationId } },
      include: { content: { select: { type: true } } },
    });

    if (!item) {
      return NextResponse.json(
        { error: "Item não encontrado" },
        { status: 404 },
      );
    }

    const body = itemUpdateSchema.parse(await readJsonRequest(request));

    let parsedData: unknown;
    if (body.data !== undefined) {
      const result = itemDataSchema(item.content.type).safeParse(body.data);
      if (!result.success) {
        return NextResponse.json(
          { error: "Dados do item inválidos" },
          { status: 422 },
        );
      }
      parsedData = result.data;
    }

    const updated = await prisma.meetingContentItem.update({
      where: { id: itemId },
      data: {
        ...(parsedData !== undefined && { data: parsedData as object }),
        ...(body.position !== undefined && { position: body.position }),
      },
    });

    return NextResponse.json({ item: updated });
  } catch (error) {
    return handleApiError(error);
  }
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
