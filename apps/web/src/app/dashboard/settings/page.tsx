import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings-client";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

export default async function SettingsPage() {
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

  if (member.role !== "owner") {
    redirect("/dashboard");
  }

  return <SettingsClient isSuperUser={member.isSuperUser} />;
}
