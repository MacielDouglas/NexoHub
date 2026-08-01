import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getOrCreateCleaningConfig } from "@/lib/cleaning-config";
import {
  DEFAULT_SECTORS,
  isCleaningType,
  isCleaningUnit,
  isGender,
  unitsForType,
} from "@/lib/cleaning-defaults";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageConfig(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const config = await getOrCreateCleaningConfig(member.organizationId);

  const body = await request.json();
  const {
    type,
    defaultKey,
    name,
    task,
    unit,
    peopleCount,
    allowYoung,
    gender,
  } = body;

  if (!isCleaningType(type)) {
    return NextResponse.json(
      { error: "Tipo de limpeza inválido" },
      { status: 400 },
    );
  }

  const defaults =
    typeof defaultKey === "string" && defaultKey
      ? DEFAULT_SECTORS.find((d) => d.key === defaultKey && d.type === type)
      : undefined;

  if (defaultKey && !defaults) {
    return NextResponse.json(
      { error: "Setor padrão inválido para este tipo de limpeza" },
      { status: 400 },
    );
  }

  if (defaults) {
    const existing = await prisma.cleaningSector.findFirst({
      where: { cleaningConfigId: config.id, type, defaultKey: defaults.key },
    });

    if (existing) {
      const restored = await prisma.cleaningSector.update({
        where: { id: existing.id },
        data: {
          name: null,
          task: null,
          unit: defaults.unit,
          peopleCount:
            type === "meeting" ? (defaults.peopleCount ?? null) : null,
          allowYoung:
            type === "meeting" ? (defaults.allowYoung ?? false) : false,
          gender: type === "meeting" ? (defaults.gender ?? "any") : "any",
        },
      });
      return NextResponse.json({ sector: restored });
    }

    const count = await prisma.cleaningSector.count({
      where: { cleaningConfigId: config.id, type },
    });

    const sector = await prisma.cleaningSector.create({
      data: {
        cleaningConfigId: config.id,
        type,
        defaultKey: defaults.key,
        name: null,
        task: null,
        unit: defaults.unit,
        peopleCount: type === "meeting" ? (defaults.peopleCount ?? null) : null,
        allowYoung: type === "meeting" ? (defaults.allowYoung ?? false) : false,
        gender: type === "meeting" ? (defaults.gender ?? "any") : "any",
        sortOrder: count,
      },
    });

    return NextResponse.json({ sector }, { status: 201 });
  }

  if (!isCleaningUnit(unit) || !unitsForType(type).includes(unit)) {
    return NextResponse.json(
      { error: "Unidade de designação inválida para este tipo de limpeza" },
      { status: 400 },
    );
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Nome do setor é obrigatório" },
      { status: 400 },
    );
  }

  const count = await prisma.cleaningSector.count({
    where: { cleaningConfigId: config.id, type },
  });

  const sector = await prisma.cleaningSector.create({
    data: {
      cleaningConfigId: config.id,
      type,
      defaultKey: null,
      name: name.trim(),
      task: typeof task === "string" && task.trim() ? task.trim() : null,
      unit,
      peopleCount: type === "meeting" ? (peopleCount ?? null) : null,
      allowYoung: type === "meeting" ? Boolean(allowYoung) : false,
      gender: type === "meeting" ? (isGender(gender) ? gender : "any") : "any",
      sortOrder: count,
    },
  });

  return NextResponse.json({ sector }, { status: 201 });
}
