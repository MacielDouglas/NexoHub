import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { language } = await request.json();

  if (language !== "pt" && language !== "es") {
    return NextResponse.json({ error: "Idioma inválido" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { language },
  });

  return NextResponse.json({ message: "Idioma atualizado" });
}
