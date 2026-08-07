import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ACTIVE_ORG_COOKIE } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    select: { id: true },
  });

  if (!organization) {
    return NextResponse.json(
      { error: "Congregação não encontrada" },
      { status: 404 },
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, id, {
    path: "/",
    maxAge: 60 * 60 * 8,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.json({ organizationId: id });
}
