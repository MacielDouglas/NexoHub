import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { updatePartSchema } from "@/lib/schemas";

export async function PUT(
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

  const part = await prisma.meetingPart.findUnique({
    where: { id },
    include: { meetingConfig: true },
  });

  if (!part || part.meetingConfig.organizationId !== member.organizationId) {
    return NextResponse.json(
      { error: "Parte não encontrada" },
      { status: 404 },
    );
  }

  try {
    const body = updatePartSchema.parse(await readJsonRequest(request));

    const updated = await prisma.meetingPart.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.durationMinutes !== undefined && {
          durationMinutes: body.durationMinutes,
        }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        ...(body.description !== undefined && {
          description: body.description,
        }),
      },
    });

    return NextResponse.json({ part: updated });
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

  if (!canManageConfig(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const part = await prisma.meetingPart.findUnique({
    where: { id },
    include: { meetingConfig: true },
  });

  if (!part || part.meetingConfig.organizationId !== member.organizationId) {
    return NextResponse.json(
      { error: "Parte não encontrada" },
      { status: 404 },
    );
  }

  await prisma.meetingPart.delete({ where: { id } });

  return NextResponse.json({ message: "Parte removida" });
}
