import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const members = await prisma.member.findMany({
    where: { organizationId: member.organizationId },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ members });
}
