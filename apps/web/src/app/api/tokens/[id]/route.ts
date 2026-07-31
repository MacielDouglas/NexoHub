import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canManageMembers, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const token = await prisma.inviteToken.findUnique({ where: { id } });

  if (!token) {
    return NextResponse.json(
      { error: "Token não encontrado" },
      { status: 404 },
    );
  }

  const isSuperUser = session.user.globalRole === "super_user";

  if (!isSuperUser) {
    const member = await getUserOrg(await headers());
    if (!member || !canManageMembers(member.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
    const isOwnerOfToken = token.createdById === session.user.id;
    const belongsToOrg = token.organizationId === member.organizationId;
    if (!isOwnerOfToken && !belongsToOrg) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
  }

  await prisma.inviteToken.update({
    where: { id },
    data: { status: "revoked" },
  });

  return NextResponse.json({ message: "Token revogado" });
}
