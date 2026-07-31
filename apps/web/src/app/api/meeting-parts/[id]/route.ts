import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

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

  const { name, durationMinutes, sortOrder, description } =
    await request.json();

  const updated = await prisma.meetingPart.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(description !== undefined && { description }),
    },
  });

  return NextResponse.json({ part: updated });
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
