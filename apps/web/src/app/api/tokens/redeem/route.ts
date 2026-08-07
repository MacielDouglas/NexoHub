import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { rateLimited } from "@/lib/rate-limit";
import { redeemCodeSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (rateLimited(`redeem:${session.user.id}:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um momento e tente novamente." },
      { status: 429 },
    );
  }

  try {
    const { code } = redeemCodeSchema.parse(await readJsonRequest(request));

    const token = await prisma.inviteToken.findUnique({ where: { code } });

    if (!token || token.status !== "active") {
      return NextResponse.json(
        { error: "Código inválido ou já utilizado" },
        { status: 404 },
      );
    }

    if (token.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Este código expirou. Peça um novo convite." },
        { status: 410 },
      );
    }

    const user = session.user;

    if (user.globalRole === "super_user") {
      return NextResponse.json(
        { error: "Super-User não pode aceitar convites" },
        { status: 400 },
      );
    }

    const existingMember = await prisma.member.findFirst({
      where: { userId: user.id },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "Você já pertence a uma congregação" },
        { status: 409 },
      );
    }

    if (token.purpose === "owner") {
      if (user.globalRole === "owner") {
        return NextResponse.json(
          { error: "Você já é um Owner" },
          { status: 409 },
        );
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { globalRole: "owner" },
        }),
        prisma.inviteToken.update({
          where: { id: token.id },
          data: { status: "used", usedById: user.id, usedAt: new Date() },
        }),
      ]);

      return NextResponse.json({ purpose: "owner", next: "/create-org" });
    }

    if (token.purpose === "member") {
      if (!token.organizationId) {
        return NextResponse.json(
          { error: "Convite inválido" },
          { status: 400 },
        );
      }

      const organization = await prisma.organization.findUnique({
        where: { id: token.organizationId },
        select: { id: true, slug: true, name: true },
      });

      if (!organization) {
        return NextResponse.json(
          { error: "Congregação não encontrada" },
          { status: 404 },
        );
      }

      await prisma.$transaction([
        prisma.member.create({
          data: {
            organizationId: token.organizationId,
            userId: user.id,
            role: "member",
          },
        }),
        prisma.inviteToken.update({
          where: { id: token.id },
          data: { status: "used", usedById: user.id, usedAt: new Date() },
        }),
      ]);

      return NextResponse.json({
        purpose: "member",
        organizationSlug: organization.slug,
        next: "/app",
      });
    }

    return NextResponse.json({ error: "Convite inválido" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
