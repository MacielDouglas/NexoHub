import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function PUT(request: Request, { params }: { params: Params }) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = (await readJsonRequest(request)) as {
      name?: string;
      description?: string;
    };

    const existing = await prisma.subOrganization.findFirst({
      where: { id, organizationId: member.organizationId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Sub-organização não encontrada" },
        { status: 404 },
      );
    }

    const subOrg = await prisma.subOrganization.update({
      where: { id },
      data: {
        ...(body.name?.trim() && { name: body.name.trim() }),
        ...(body.description !== undefined && {
          description: body.description?.trim() ?? null,
        }),
      },
    });

    return NextResponse.json({ subOrg });
  } catch (error) {
    return handleApiError(error);
  }
}

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

  const existing = await prisma.subOrganization.findFirst({
    where: { id, organizationId: member.organizationId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Sub-organização não encontrada" },
      { status: 404 },
    );
  }

  await prisma.subOrganization.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
