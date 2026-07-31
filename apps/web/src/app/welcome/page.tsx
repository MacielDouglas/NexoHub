import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { WelcomeClient } from "@/components/welcome-client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function WelcomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (session.user.globalRole === "super_user") {
    redirect("/admin");
  }

  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (member) {
    redirect("/dashboard");
  }

  if (session.user.globalRole === "owner") {
    redirect("/create-org");
  }

  return <WelcomeClient lang={session.user.language} />;
}
