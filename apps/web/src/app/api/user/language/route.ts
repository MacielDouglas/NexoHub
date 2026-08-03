import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { handleApiError, readJsonRequest } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { updateLanguageSchema } from "@/lib/schemas";

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const { language } = updateLanguageSchema.parse(
      await readJsonRequest(request),
    );

    await prisma.user.update({
      where: { id: session.user.id },
      data: { language },
    });

    return NextResponse.json({ message: "Idioma atualizado" });
  } catch (error) {
    return handleApiError(error);
  }
}
