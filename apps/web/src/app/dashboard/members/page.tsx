import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { MembersClient } from "@/components/members-client";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

export default async function MembersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const member = await getUserOrg(await headers());

  if (!member) {
    if (session.user.globalRole === "super_user") {
      redirect("/admin");
    }
    if (session.user.globalRole === "owner") {
      redirect("/create-org");
    }
    redirect("/welcome");
  }

  const [members, tokens] = await Promise.all([
    prisma.member.findMany({
      where: { organizationId: member.organizationId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.inviteToken.findMany({
      where: { purpose: "member", organizationId: member.organizationId },
      orderBy: { createdAt: "desc" },
      include: { usedBy: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return (
    <MembersClient
      initialMembers={members}
      initialTokens={tokens.map((token) => ({
        ...token,
        expiresAt: token.expiresAt.toISOString(),
        createdAt: token.createdAt.toISOString(),
        usedBy: token.usedBy ?? null,
      }))}
      sessionUserId={session.user.id}
    />
  );
}
