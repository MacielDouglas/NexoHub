import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { updateMeetingConfigSchema } from "@/lib/schemas";

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

  try {
    const body = updateMeetingConfigSchema.parse(
      await readJsonRequest(request),
    );

    if (body.defaultSentinelaConductorId) {
      const person = await prisma.person.findFirst({
        where: {
          id: body.defaultSentinelaConductorId,
          organizationId: member.organizationId,
        },
        select: { id: true },
      });
      if (!person) {
        return NextResponse.json(
          { error: "Pessoa inválida para dirigente padrão" },
          { status: 400 },
        );
      }
    }

    const config = await prisma.meetingConfig.update({
      where: { id },
      data: {
        ...(body.type !== undefined && { type: body.type }),
        ...(body.dayOfWeek !== undefined && { dayOfWeek: body.dayOfWeek }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.defaultSentinelaConductorId !== undefined && {
          defaultSentinelaConductorId: body.defaultSentinelaConductorId,
        }),
      },
      include: { parts: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ config });
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
