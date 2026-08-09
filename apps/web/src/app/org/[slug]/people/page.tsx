import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { PeopleClient } from "@/features/people/people-client";
import { getServerT } from "@/i18n/server";
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

  if (!canManage) {
    redirect(`/org/${slug}`);
  }

  const [people, families, users, subOrgs, members, tokens] = await Promise.all(
    [
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
      prisma.subOrganization.findMany({
        where: { organizationId: member.organizationId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
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
        where: {
          purpose: "member",
          organizationId: member.organizationId,
        },
        orderBy: { createdAt: "desc" },
        include: { usedBy: { select: { id: true, name: true, email: true } } },
      }),
    ],
  );

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

  const t = getServerT(session.user.language);

  return (
    <PeopleClient
      canManage={canManage}
      currentUserId={session.user.id}
      currentRole={member.role}
      people={peopleSerialized}
      families={families}
      users={users}
      subOrgs={subOrgs}
      stats={stats}
      initialMembers={members}
      initialTokens={tokens.map((token) => ({
        ...token,
        expiresAt: token.expiresAt.toISOString(),
        createdAt: token.createdAt.toISOString(),
      }))}
      membersLabels={{
        inviteTitle: t("members.inviteTitle"),
        inviteDescription: t("members.inviteDescription"),
        createToken: t("members.createToken"),
        copyCode: t("members.copyCode"),
        tokenHint: t("members.tokenHint"),
        codeCopied: t("members.codeCopied"),
        listTitle: t("members.listTitle"),
        noMembers: t("members.noMembers"),
        you: t("members.you"),
        promoteOwner: t("members.promoteOwner"),
        demoteOwner: t("members.demoteOwner"),
        promoteAdmin: t("members.promoteAdmin"),
        remove: t("members.remove"),
        memberRemoved: t("members.memberRemoved"),
        removeConfirmTitle: t("members.removeConfirmTitle"),
        removeConfirmDescription: t("members.removeConfirmDescription"),
        roleUpdated: t("members.roleUpdated"),
        error: t("common.error"),
        cancel: t("common.cancel"),
        loading: t("common.loading"),
        roles: {
          owner: t("members.roles.owner"),
          admin: t("members.roles.admin"),
          member: t("members.roles.member"),
        },
      }}
    />
  );
}
