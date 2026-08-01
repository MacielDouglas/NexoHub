import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { DEFAULT_SECTORS } from "@/lib/cleaning-defaults";
import { canManageConfig, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
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

  const existing = await prisma.cleaningSector.findFirst({
    where: { id, cleaningConfig: { organizationId: member.organizationId } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Setor não encontrado" },
      { status: 404 },
    );
  }

  if (!existing.defaultKey) {
    return NextResponse.json(
      { error: "Este setor não é um setor padrão" },
      { status: 400 },
    );
  }

  const defaults = DEFAULT_SECTORS.find(
    (d) => d.key === existing.defaultKey && d.type === existing.type,
  );

  if (!defaults) {
    return NextResponse.json(
      { error: "Padrão não encontrado para este setor" },
      { status: 400 },
    );
  }

  const sector = await prisma.cleaningSector.update({
    where: { id },
    data: {
      name: null,
      task: null,
      unit: defaults.unit,
      peopleCount: defaults.peopleCount ?? null,
      allowYoung: defaults.allowYoung ?? false,
      gender: defaults.gender ?? "any",
    },
  });

  return NextResponse.json({ sector });
}
