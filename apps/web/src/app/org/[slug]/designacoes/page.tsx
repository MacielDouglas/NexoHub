import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DesignacoesPageClient } from "@/features/designacoes/designacoes-page-client";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DesignacoesPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
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

  const sp = await searchParams;
  const rawTab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: "cleaning" | "meeting" =
    rawTab === "cleaning" ? "cleaning" : "meeting";

  return (
    <DesignacoesPageClient
      slug={slug}
      role={member.role}
      orgName={member.organization.name}
      organizationId={member.organizationId}
      tab={tab}
    />
  );
}
