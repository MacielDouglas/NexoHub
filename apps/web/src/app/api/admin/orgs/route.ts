import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.user.globalRole !== "super_user") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const organizations = await prisma.organization.findMany({
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ organizations });
}
