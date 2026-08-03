import { headers } from "next/headers";
import { NextResponse } from "next/server";
import {
  isCleaningUnit,
  isGender,
  unitsForType,
} from "@/lib/cleaning-defaults";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { cleaningSectorInputSchema } from "@/lib/schemas";

async function findSector(memberOrganizationId: string, id: string) {
  return prisma.cleaningSector.findFirst({
    where: { id, cleaningConfig: { organizationId: memberOrganizationId } },
  });
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
  const existing = await findSector(member.organizationId, id);

  if (!existing) {
    return NextResponse.json(
      { error: "Setor não encontrado" },
      { status: 404 },
    );
  }

  try {
    const { name, task, unit, peopleCount, allowYoung, gender } =
      cleaningSectorInputSchema.partial().parse(await readJsonRequest(request));

    if (typeof unit === "string" && !isCleaningUnit(unit)) {
      return NextResponse.json(
        { error: "Unidade de designação inválida" },
        { status: 400 },
      );
    }

    if (
      typeof unit === "string" &&
      !unitsForType(existing.type as "meeting" | "weekly" | "general").includes(
        unit as never,
      )
    ) {
      return NextResponse.json(
        { error: "Unidade de designação inválida para este tipo de limpeza" },
        { status: 400 },
      );
    }

    const sector = await prisma.cleaningSector.update({
      where: { id },
      data: {
        ...(name !== undefined && {
          name: typeof name === "string" && name.trim() ? name.trim() : null,
        }),
        ...(task !== undefined && {
          task: typeof task === "string" && task.trim() ? task.trim() : null,
        }),
        ...(typeof unit === "string" && { unit }),
        ...(existing.type === "meeting" && {
          ...(peopleCount !== undefined && {
            peopleCount: peopleCount ?? null,
          }),
          ...(allowYoung !== undefined && { allowYoung: Boolean(allowYoung) }),
          ...(gender !== undefined && {
            gender:
              typeof gender === "string" && isGender(gender) ? gender : "any",
          }),
        }),
      },
    });

    return NextResponse.json({ sector });
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
  const existing = await findSector(member.organizationId, id);

  if (!existing) {
    return NextResponse.json(
      { error: "Setor não encontrado" },
      { status: 404 },
    );
  }

  await prisma.cleaningSector.delete({ where: { id } });

  return NextResponse.json({ message: "Setor removido" });
}
