import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfilePageClient } from "@/features/profile/profile-page-client";
import { getServerT } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProfilePage({ params, searchParams }: PageProps) {
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
    redirect(`/org/${member.organization.slug}/profile`);
  }

  const canManage = member.role === "owner" || member.role === "admin";

  const sp = await searchParams;
  const rawView = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const view: "profile" | "people" =
    canManage && rawView === "people" ? "people" : "profile";

  const t = getServerT(session.user.language);

  const person = await prisma.person.findFirst({
    where: {
      organizationId: member.organizationId,
      userId: session.user.id,
    },
    select: { id: true, name: true },
  });

  let peopleProps = null;
  if (canManage) {
    const [people, families, users, subOrgs, members, tokens] =
      await Promise.all([
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
          include: {
            usedBy: { select: { id: true, name: true, email: true } },
          },
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

    peopleProps = {
      canManage,
      currentUserId: session.user.id,
      currentRole: member.role,
      people: people.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      families,
      users,
      subOrgs,
      stats,
      initialMembers: members,
      initialTokens: tokens.map((token) => ({
        ...token,
        expiresAt: token.expiresAt.toISOString(),
        createdAt: token.createdAt.toISOString(),
      })),
      membersLabels: {
        inviteTitle: t("members.inviteTitle"),
        inviteDescription: t("members.inviteDescription"),
        createToken: t("members.createToken"),
        copyCode: t("members.copyCode"),
        tokenHint: t("members.tokenHint"),
        codeCopied: t("members.codeCopied"),
        tokensTitle: t("members.tokensTitle"),
        noTokens: t("members.noTokens"),
        revoke: t("members.revoke"),
        revokeConfirmTitle: t("members.revokeConfirmTitle"),
        revokeConfirmDescription: t("members.revokeConfirmDescription"),
        tokenRevoked: t("members.tokenRevoked"),
        tokenStatus: {
          active: t("members.tokenStatus.active"),
          used: t("members.tokenStatus.used"),
          revoked: t("members.tokenStatus.revoked"),
          expired: t("members.tokenStatus.expired"),
        },
        listTitle: t("members.listTitle"),
        noMembers: t("members.noMembers"),
        you: t("members.you"),
        promoteOwner: t("members.promoteOwner"),
        demoteOwner: t("members.demoteOwner"),
        promoteAdmin: t("members.promoteAdmin"),
        demoteAdmin: t("members.demoteAdmin"),
        demoteAdminConfirmTitle: t("members.demoteAdminConfirmTitle"),
        demoteAdminConfirmDescription: t(
          "members.demoteAdminConfirmDescription",
        ),
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
      },
    };
  }

  return (
    <ProfilePageClient
      slug={slug}
      role={member.role}
      view={view}
      profile={{
        initialProfile: {
          userId: session.user.id,
          name: session.user.name ?? null,
          email: session.user.email,
          image: session.user.image ?? null,
          personId: person?.id ?? null,
          personName: person?.name ?? null,
        },
        labels: {
          title: t("profile.title"),
          subtitle: t("profile.subtitle"),
          accountTitle: t("profile.account"),
          personTitle: t("profile.person"),
          personDescription: t("profile.personDescription"),
          noPerson: t("profile.noPerson"),
          personNameLabel: t("profile.personName"),
          save: t("common.save"),
          saving: t("common.loading"),
          minLength: t("profile.minLength"),
          saved: t("profile.saved"),
        },
      }}
      people={peopleProps}
    />
  );
}
