import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SubOrgDetailClient } from "@/features/sub-org/sub-org-detail-client";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

type PageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default async function SubOrgDetailPage({ params }: PageProps) {
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

  const { id } = await params;

  return (
    <SubOrgDetailClient
      role={member.role}
      organizationId={member.organizationId}
      subOrgId={id}
    />
  );
}
