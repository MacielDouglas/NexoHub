import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { SettingsBottomNav } from "@/features/settings/components/settings-bottom-nav";
import { SettingsSideNav } from "@/features/settings/components/settings-side-nav";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

type Props = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function SettingsLayout({ children, params }: Props) {
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

  const canManageSettings = member.role === "owner" || member.role === "admin";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 pb-24 md:pb-8">
      <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
        <aside className="md:sticky md:top-4">
          <div className="rounded-[28px] border border-border bg-card p-3 shadow-sm">
            <SettingsSideNav
              slug={slug}
              canManageSettings={canManageSettings}
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-5">{children}</div>
      </div>

      <SettingsBottomNav slug={slug} canManageSettings={canManageSettings} />
    </div>
  );
}
