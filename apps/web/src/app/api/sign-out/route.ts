import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACTIVE_ORG_COOKIE } from "@/lib/org-utils";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);
  return NextResponse.json({ message: "Sessão encerrada" });
}
