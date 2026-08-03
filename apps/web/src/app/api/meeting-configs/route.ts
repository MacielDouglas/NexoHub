import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { createMeetingConfigSchema } from "@/lib/schemas";

export async function GET() {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const configs = await prisma.meetingConfig.findMany({
    where: { organizationId: member.organizationId },
    include: { parts: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ configs });
}

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageConfig(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { type, dayOfWeek, startTime } = createMeetingConfigSchema.parse(
      await readJsonRequest(request),
    );

    const existing = await prisma.meetingConfig.findUnique({
      where: {
        organizationId_type: { organizationId: member.organizationId, type },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Já existe uma configuração para "${type}"` },
        { status: 409 },
      );
    }

    const config = await prisma.meetingConfig.create({
      data: {
        organizationId: member.organizationId,
        type,
        dayOfWeek,
        startTime,
      },
      include: { parts: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
