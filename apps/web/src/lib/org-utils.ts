import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getUserOrg(headers: Headers) {
  const session = await auth.api.getSession({ headers });

  if (!session) return null;

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  return member;
}

export function canManageConfig(role: string | null): boolean {
  return role === "owner" || role === "admin";
}
