import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

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

  const { name, durationMinutes, sortOrder, description } =
    await request.json();

  if (!name || sortOrder === undefined) {
    return NextResponse.json(
      { error: "Campos obrigatórios: name, sortOrder" },
      { status: 400 },
    );
  }

  const part = await prisma.meetingPart.create({
    data: {
      meetingConfigId: id,
      name,
      durationMinutes,
      sortOrder,
      description,
    },
  });

  return NextResponse.json({ part }, { status: 201 });
}
