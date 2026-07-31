import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.user.globalRole !== "super_user") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;

  const organization = await prisma.organization.findUnique({
    where: { id },
  });

  if (!organization) {
    return NextResponse.json(
      { error: "Congregação não encontrada" },
      { status: 404 },
    );
  }

  await prisma.organization.delete({ where: { id } });

  return NextResponse.json({ message: "Congregação excluída" });
}
