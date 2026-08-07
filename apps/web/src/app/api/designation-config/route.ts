import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageSchedules, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { designationConfigUpdateSchema } from "@/lib/schemas";

function serializeConfig(config: {
  id: string;
  micCount: number;
  indicadorCount: number;
  indicadorSectors: unknown;
  enabledSectors: unknown;
}) {
  return {
    id: config.id,
    micCount: config.micCount,
    indicadorCount: config.indicadorCount,
    indicadorSectors: Array.isArray(config.indicadorSectors)
      ? (config.indicadorSectors as string[])
      : [],
    enabledSectors: Array.isArray(config.enabledSectors)
      ? (config.enabledSectors as string[])
      : [],
  };
}

export async function GET() {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const config = await prisma.designationConfig.findUnique({
    where: { organizationId: member.organizationId },
  });

  return NextResponse.json({
    config: config ? serializeConfig(config) : null,
  });
}

export async function PUT(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  if (!canManageSchedules(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = designationConfigUpdateSchema.parse(
      await readJsonRequest(request),
    );

    const config = await prisma.designationConfig.upsert({
      where: { organizationId: member.organizationId },
      create: {
        organizationId: member.organizationId,
        micCount: body.micCount,
        indicadorCount: body.indicadorCount,
        indicadorSectors: body.indicadorSectors,
        enabledSectors: body.enabledSectors,
      },
      update: {
        micCount: body.micCount,
        indicadorCount: body.indicadorCount,
        indicadorSectors: body.indicadorSectors,
        enabledSectors: body.enabledSectors,
      },
    });

    return NextResponse.json({ config: serializeConfig(config) });
  } catch (error) {
    return handleApiError(error);
  }
}
