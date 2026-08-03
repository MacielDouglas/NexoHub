import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { createPartSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageConfig(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const config = await prisma.meetingConfig.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!config) {
    return NextResponse.json(
      { error: "Configuração não encontrada" },
      { status: 404 },
    );
  }

  try {
    const { name, durationMinutes, sortOrder, description } =
      createPartSchema.parse(await readJsonRequest(request));

    const part = await prisma.meetingPart.create({
      data: {
        meetingConfigId: id,
        name,
        durationMinutes: durationMinutes ?? null,
        sortOrder,
        description: description ?? null,
      },
    });

    return NextResponse.json({ part }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
