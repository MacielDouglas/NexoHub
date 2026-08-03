import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getOrCreateCleaningConfig } from "@/lib/cleaning-config";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { cleaningConfigUpdateSchema } from "@/lib/schemas";

export async function GET() {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const config = await getOrCreateCleaningConfig(member.organizationId);

  return NextResponse.json({
    config: {
      id: config.id,
      weeklyEnabled: config.weeklyEnabled,
      weeklyDayOfWeek: config.weeklyDayOfWeek,
      weeklyIntervalWeeks: config.weeklyIntervalWeeks,
      generalEnabled: config.generalEnabled,
    },
    sectors: config.sectors,
  });
}

export async function PUT(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageConfig(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const config = await getOrCreateCleaningConfig(member.organizationId);

  try {
    const body = cleaningConfigUpdateSchema.parse(
      await readJsonRequest(request),
    );

    const updated = await prisma.cleaningConfig.update({
      where: { id: config.id },
      data: {
        ...(body.weeklyEnabled !== undefined && {
          weeklyEnabled: body.weeklyEnabled,
        }),
        ...(body.weeklyDayOfWeek !== undefined && {
          weeklyDayOfWeek: body.weeklyDayOfWeek,
        }),
        ...(body.weeklyIntervalWeeks !== undefined && {
          weeklyIntervalWeeks: body.weeklyIntervalWeeks,
        }),
        ...(body.generalEnabled !== undefined && {
          generalEnabled: body.generalEnabled,
        }),
      },
    });

    return NextResponse.json({
      config: {
        id: updated.id,
        weeklyEnabled: updated.weeklyEnabled,
        weeklyDayOfWeek: updated.weeklyDayOfWeek,
        weeklyIntervalWeeks: updated.weeklyIntervalWeeks,
        generalEnabled: updated.generalEnabled,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
