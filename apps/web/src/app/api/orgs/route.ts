import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateUniqueSlug } from "@/lib/invite-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.user.globalRole !== "owner") {
    return NextResponse.json(
      { error: "Apenas Owners podem criar uma congregação" },
      { status: 403 },
    );
  }

  const existingMember = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (existingMember) {
    return NextResponse.json(
      { error: "Você já pertence a uma congregação" },
      { status: 409 },
    );
  }

  const { name } = await request.json();

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "O nome da congregação é obrigatório" },
      { status: 400 },
    );
  }

  const trimmedName = name.trim();
  if (trimmedName.length < 3) {
    return NextResponse.json(
      { error: "O nome deve ter pelo menos 3 caracteres" },
      { status: 400 },
    );
  }

  const slug = await generateUniqueSlug(trimmedName, async (candidate) => {
    const existing = await prisma.organization.findUnique({
      where: { slug: candidate },
    });
    return Boolean(existing);
  });

  const organization = await prisma.organization.create({
    data: {
      name: trimmedName,
      slug,
    },
  });

  await prisma.member.create({
    data: {
      organizationId: organization.id,
      userId: session.user.id,
      role: "owner",
    },
  });

  return NextResponse.json({ organization }, { status: 201 });
}
