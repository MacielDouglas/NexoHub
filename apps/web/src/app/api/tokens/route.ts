import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateUniqueTokenCode } from "@/lib/invite-utils";
import { canManageMembers, getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.user.globalRole === "super_user") {
    const tokens = await prisma.inviteToken.findMany({
      where: { purpose: "owner" },
      orderBy: { createdAt: "desc" },
      include: { usedBy: { select: { id: true, name: true, email: true } } },
    });
    return NextResponse.json({ tokens });
  }

  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMembers(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const tokens = await prisma.inviteToken.findMany({
    where: {
      purpose: "member",
      organizationId: member.organizationId,
    },
    orderBy: { createdAt: "desc" },
    include: { usedBy: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ tokens });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { purpose } = await request.json();

  if (session.user.globalRole === "super_user") {
    if (purpose && purpose !== "owner") {
      return NextResponse.json(
        { error: "O Super-User só cria tokens de Owner" },
        { status: 400 },
      );
    }
    const code = await generateUniqueTokenCode(async (candidate) => {
      const existing = await prisma.inviteToken.findUnique({
        where: { code: candidate },
      });
      return Boolean(existing);
    });
    const token = await prisma.inviteToken.create({
      data: {
        code,
        purpose: "owner",
        createdById: session.user.id,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    return NextResponse.json({ token }, { status: 201 });
  }

  if (purpose && purpose !== "member") {
    return NextResponse.json(
      { error: "Owners/Admins só criam tokens de Membro" },
      { status: 400 },
    );
  }

  const member = await getUserOrg(await headers());
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (!canManageMembers(member.role)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const code = await generateUniqueTokenCode(async (candidate) => {
    const existing = await prisma.inviteToken.findUnique({
      where: { code: candidate },
    });
    return Boolean(existing);
  });
  const token = await prisma.inviteToken.create({
    data: {
      code,
      purpose: "member",
      organizationId: member.organizationId,
      createdById: session.user.id,
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return NextResponse.json({ token }, { status: 201 });
}
