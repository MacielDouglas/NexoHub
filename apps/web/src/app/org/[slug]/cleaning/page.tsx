import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CleaningAssignmentsClient } from "@/features/cleaning/cleaning-assignments-client";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CleaningPage({ params: _params }: PageProps) {
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

  return (
    <CleaningAssignmentsClient
      role={member.role}
      organizationId={member.organizationId}
    />
  );
}
