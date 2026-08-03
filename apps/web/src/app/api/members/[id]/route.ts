import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";
import { memberRoleSchema } from "@/lib/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const target = await prisma.member.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!target) {
    return NextResponse.json(
      { error: "Membro não encontrado" },
      { status: 404 },
    );
  }

  let role: string;
  try {
    ({ role } = memberRoleSchema.parse(await readJsonRequest(request)));
  } catch (error) {
    return handleApiError(error);
  }

  if (member.role === "admin") {
    if (target.role === "owner") {
      return NextResponse.json(
        { error: "Admin não pode alterar o papel de um Owner" },
        { status: 403 },
      );
    }
    if (role !== "admin" && role !== "member") {
      return NextResponse.json(
        { error: "Admin não pode promover a Owner" },
        { status: 403 },
      );
    }
  }

  if (member.role === "member") {
    return NextResponse.json(
      { error: "Apenas Owner/Admin podem alterar papéis" },
      { status: 403 },
    );
  }

  const ownerCount = await prisma.member.count({
    where: { organizationId: member.organizationId, role: "owner" },
  });

  if (
    target.role === "owner" &&
    role !== "owner" &&
    target.id === member.id &&
    ownerCount <= 1
  ) {
    return NextResponse.json(
      { error: "Não é possível rebaixar o último Owner da congregação" },
      { status: 400 },
    );
  }

  const updated = await prisma.member.update({
    where: { id: target.id },
    data: { role },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({ member: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const target = await prisma.member.findFirst({
    where: { id, organizationId: member.organizationId },
  });

  if (!target) {
    return NextResponse.json(
      { error: "Membro não encontrado" },
      { status: 404 },
    );
  }

  if (target.id === member.id) {
    return NextResponse.json(
      { error: "Use 'Sair da congregação' para se remover" },
      { status: 400 },
    );
  }

  if (member.role === "admin") {
    if (target.role === "owner") {
      return NextResponse.json(
        { error: "Admin não pode remover um Owner" },
        { status: 403 },
      );
    }
    if (target.role === "admin") {
      return NextResponse.json(
        { error: "Admin não pode remover outro Admin" },
        { status: 403 },
      );
    }
  }

  if (member.role === "member") {
    return NextResponse.json(
      { error: "Apenas Owner/Admin podem remover membros" },
      { status: 403 },
    );
  }

  const ownerCount = await prisma.member.count({
    where: { organizationId: member.organizationId, role: "owner" },
  });

  if (target.role === "owner" && ownerCount <= 1) {
    return NextResponse.json(
      { error: "Não é possível remover o último Owner da congregação" },
      { status: 400 },
    );
  }

  await prisma.member.delete({ where: { id: target.id } });

  return NextResponse.json({ message: "Membro removido" });
}
