import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CreateOrgClient } from "@/components/create-org-client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CreateOrgPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (session.user.globalRole === "super_user") {
    redirect("/admin");
  }

  if (session.user.globalRole !== "owner") {
    redirect("/welcome");
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (member) {
    redirect("/app");
  }

  return <CreateOrgClient lang={session.user.language} />;
}
