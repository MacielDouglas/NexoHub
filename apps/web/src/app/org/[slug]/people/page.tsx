import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PeoplePage({ params }: PageProps) {
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

  const canManage = member.role === "owner" || member.role === "admin";
  redirect(
    canManage ? `/org/${slug}/profile?view=people` : `/org/${slug}/profile`,
  );
}
