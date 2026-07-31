import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  if (session.user.globalRole !== "super_user") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email é obrigatório" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Usuário não encontrado. O usuário precisa fazer login primeiro.",
      },
      { status: 404 },
    );
  }

  if (user.globalRole === "owner") {
    return NextResponse.json({ error: "Usuário já é Owner" }, { status: 409 });
  }

  if (user.globalRole === "super_user") {
    return NextResponse.json(
      { error: "Não é possível alterar o papel de um Super_User" },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { globalRole: "owner" },
  });

  return NextResponse.json({ message: `Usuário ${email} promovido a Owner` });
}
