import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const current = await prisma.member.findUnique({
    where: { id: member.id },
  });

  if (!current) {
    return NextResponse.json(
      { error: "Membro não encontrado" },
      { status: 404 },
    );
  }

  if (current.role === "owner") {
    const ownerCount = await prisma.member.count({
      where: { organizationId: current.organizationId, role: "owner" },
    });

    if (ownerCount > 1) {
      await prisma.member.delete({ where: { id: current.id } });
      return NextResponse.json({ message: "Você saiu da congregação" });
    }

    const admin = await prisma.member.findFirst({
      where: { organizationId: current.organizationId, role: "admin" },
      orderBy: { createdAt: "asc" },
    });

    if (!admin) {
      return NextResponse.json(
        {
          error:
            "Você é o único Owner. Promova um membro a Admin para poder sair.",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction([
      prisma.member.update({
        where: { id: admin.id },
        data: { role: "owner" },
      }),
      prisma.member.delete({ where: { id: current.id } }),
    ]);

    return NextResponse.json({
      message:
        "Propriedade transferida para um Admin e você saiu da congregação",
    });
  }

  await prisma.member.delete({ where: { id: current.id } });

  return NextResponse.json({ message: "Você saiu da congregação" });
}
