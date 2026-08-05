import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function DELETE(
  _request: Request,
  { params }: { params: Params },
) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.personTalk.findFirst({
    where: { id, person: { organizationId: member.organizationId } },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Discurso não encontrado" },
      { status: 404 },
    );
  }

  await prisma.personTalk.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
