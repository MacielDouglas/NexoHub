import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
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

  const config = await prisma.meetingConfig.findFirst({
    where: { id, organizationId: member.organizationId },
    include: { parts: { orderBy: { sortOrder: "asc" } } },
  });

  if (!config) {
    return NextResponse.json(
      { error: "Configuração não encontrada" },
      { status: 404 },
    );
  }

  return NextResponse.json({ config });
}

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

  const existing = await prisma.meetingConfig.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Configuração não encontrada" },
      { status: 404 },
    );
  }

  const { type, dayOfWeek, startTime, durationMinutes, isActive } =
    await request.json();

  const config = await prisma.meetingConfig.update({
    where: { id },
    data: {
      ...(type !== undefined && { type }),
      ...(dayOfWeek !== undefined && { dayOfWeek }),
      ...(startTime !== undefined && { startTime }),
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { parts: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ config });
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

  const existing = await prisma.meetingConfig.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Configuração não encontrada" },
      { status: 404 },
    );
  }

  await prisma.meetingConfig.delete({ where: { id } });

  return NextResponse.json({ message: "Configuração removida" });
}
