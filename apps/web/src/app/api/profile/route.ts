import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "O nome deve ter no mínimo 3 caracteres")
      .max(100),
  })
  .strict();

export async function GET() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const member = await getUserOrg(requestHeaders);
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const person = await prisma.person.findFirst({
    where: {
      organizationId: member.organizationId,
      userId: session.user.id,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({
    profile: {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
      personId: person?.id ?? null,
      personName: person?.name ?? null,
    },
  });
}

export async function PATCH(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const member = await getUserOrg(requestHeaders);
  if (!member) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await readJsonRequest(request);
  } catch (error) {
    return handleApiError(error);
  }

  const parse = updateProfileSchema.safeParse(raw);
  if (!parse.success) {
    return handleApiError(parse.error);
  }

  const { name } = parse.data;

  const person = await prisma.person.findFirst({
    where: {
      organizationId: member.organizationId,
      userId: session.user.id,
    },
    select: { id: true, name: true, userId: true },
  });

  if (!person?.userId) {
    return NextResponse.json(
      { error: "Nenhuma pessoa vinculada a esta conta" },
      { status: 400 },
    );
  }
  const duplicate = await prisma.person.findFirst({
    where: {
      organizationId: member.organizationId,
      name: { equals: name, mode: "insensitive" },
      id: { not: person.id },
    },
    select: { id: true },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Já existe uma pessoa com este nome" },
      { status: 409 },
    );
  }

  const updated = await prisma.person.update({
    where: { id: person.id },
    data: { name },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json({
    profile: {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
      personId: updated.id,
      personName: updated.name,
    },
  });
}
