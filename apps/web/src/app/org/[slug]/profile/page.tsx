import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/features/profile/profile-client";
import { getServerT } from "@/i18n/server";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProfilePage({ params }: PageProps) {
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

  const person = await prisma.person.findFirst({
    where: {
      organizationId: member.organizationId,
      userId: session.user.id,
    },
    select: { id: true, name: true },
  });

  const t = getServerT(session.user.language);

  return (
    <ProfileClient
      initialProfile={{
        userId: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email,
        image: session.user.image ?? null,
        personId: person?.id ?? null,
        personName: person?.name ?? null,
      }}
      labels={{
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
      }}
    />
  );
}
