import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PeopleClient } from "@/features/people/people-client";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PeoplePage({ params }: PageProps) {
  const { slug } = await params;
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const member = await getUserOrg(requestHeaders);

  if (!member) {
    if (session.user.globalRole === "super_user") {
      redirect("/admin");
    }
    if (session.user.globalRole === "owner") {
      redirect("/create-org");
    }
    redirect("/welcome");
  }

  if (member.organization.slug !== slug) {
    redirect(`/org/${member.organization.slug}/people`);
  }

  const canManage = member.role === "owner" || member.role === "admin";

  const [people, families, users] = await Promise.all([
    prisma.person.findMany({
      where: { organizationId: member.organizationId },
      include: {
        family: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.family.findMany({
      where: { organizationId: member.organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: {
        members: { some: { organizationId: member.organizationId } },
        person: { is: null },
      },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const stats = {
    total: people.length,
    active: people.filter((p) => p.active).length,
    families: families.length,
    men: people.filter((p) => p.sex === "MALE").length,
    women: people.filter((p) => p.sex === "FEMALE").length,
    servicePrivilege: people.filter((p) => p.privilegioServico).length,
  };

  const peopleSerialized = people.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <PeopleClient
      slug={slug}
      canManage={canManage}
      people={peopleSerialized}
      families={families}
      users={users}
      stats={stats}
    />
  );
}
