import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { canManageMeetingContent, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const subOrgId = searchParams.get("subOrgId");

  if (subOrgId) {
    const subOrg = await prisma.subOrganization.findFirst({
      where: { id: subOrgId, organizationId: member.organizationId },
      include: {
        people: {
          orderBy: { name: "asc" },
          include: {
            talks: {
              orderBy: { createdAt: "asc" },
              include: {
                meetingContentItem: { select: { id: true, data: true } },
              },
            },
          },
        },
      },
    });
    if (!subOrg) {
      return NextResponse.json(
        { error: "Sub-organização não encontrada" },
        { status: 404 },
      );
    }
    return NextResponse.json({ subOrg });
  }

  const subOrgs = await prisma.subOrganization.findMany({
    where: { organizationId: member.organizationId },
    include: { _count: { select: { people: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ subOrgs });
}

export async function POST(request: Request) {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMeetingContent(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const body = (await readJsonRequest(request)) as {
      name?: string;
      description?: string;
    };
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 },
      );
    }

    const subOrg = await prisma.subOrganization.create({
      data: {
        organizationId: member.organizationId,
        name: body.name.trim(),
        description: body.description?.trim() ?? null,
      },
    });

    return NextResponse.json({ subOrg }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
