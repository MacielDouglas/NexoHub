import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

type SessionData = {
  user?: {
    id: string;
    globalRole: "super_user" | "owner" | "member";
  } | null;
  session?: {
    activeOrganizationId?: string | null;
  } | null;
};

export default async function AppEntryPage() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as SessionData | null;

  if (!session?.user) {
    redirect("/");
  }

  const member = await getUserOrg(await headers());
  const isSuperUser = Boolean(member?.isSuperUser);

  const activeOrganizationId = session.session?.activeOrganizationId ?? null;

  if (activeOrganizationId) {
    const activeOrganization = await prisma.organization.findUnique({
      where: { id: activeOrganizationId },
      select: { slug: true },
    });

    if (activeOrganization?.slug) {
      redirect(`/org/${activeOrganization.slug}`);
    }
  }

  if (isSuperUser) {
    if (!member) {
      redirect("/admin");
    } else {
      redirect(`/org/${member.organization.slug}`);
    }
  } else if (!member) {
    if (session.user.globalRole === "owner") {
      redirect("/create-org");
    }
    redirect("/welcome");
  } else {
    redirect(`/org/${member.organization.slug}`);
  }
}
