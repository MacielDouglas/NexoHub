import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ACTIVE_ORG_COOKIE } from "@/lib/org-utils";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);

  return NextResponse.json({ message: "Org inativa" });
}
