import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { I18nSync } from "@/components/i18n-sync";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const member = await getUserOrg(await headers());

  if (session.user.globalRole === "super_user") {
    if (!member) {
      redirect("/admin");
    }
  } else if (!member) {
    if (session.user.globalRole === "owner") {
      redirect("/create-org");
    }
    redirect("/welcome");
  }

  const org = member?.organization;
  const role = member?.role;
  const isSuperUser = Boolean(member?.isSuperUser);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <I18nSync lang={session.user.language} />
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED]">
                <span className="text-lg font-bold text-white">N</span>
              </div>
              <span className="text-lg font-semibold">Nexohub</span>
            </div>
            <DashboardNav role={role} isSuperUser={isSuperUser} />
          </div>
          <div className="flex items-center gap-3">
            {org && (
              <span className="max-w-40 truncate text-sm text-muted-foreground">
                {org.name}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {session.user.name}
            </span>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
