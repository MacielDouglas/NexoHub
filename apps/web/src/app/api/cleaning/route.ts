import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getOrCreateCleaningConfig } from "@/lib/cleaning-config";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

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

  const {
    weeklyEnabled,
    weeklyDayOfWeek,
    weeklyIntervalWeeks,
    generalEnabled,
  } = await request.json();

  const updated = await prisma.cleaningConfig.update({
    where: { id: config.id },
    data: {
      ...(weeklyEnabled !== undefined && { weeklyEnabled }),
      ...(weeklyDayOfWeek !== undefined && {
        weeklyDayOfWeek: weeklyDayOfWeek ?? null,
      }),
      ...(weeklyIntervalWeeks !== undefined && { weeklyIntervalWeeks }),
      ...(generalEnabled !== undefined && { generalEnabled }),
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
}
