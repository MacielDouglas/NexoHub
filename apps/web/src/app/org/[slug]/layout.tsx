import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/nav/sidebar";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";
import { OrgHeader } from "./header";

type OrganizationLayoutProps = {
  children: React.ReactNode;
};

export default async function OrganizationLayout({
  children,
}: OrganizationLayoutProps) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <Sidebar currentSlug={org.slug} organizationName={org.name} />
        <div className="flex min-h-screen flex-col">
          <OrgHeader
            userName={session.user.name ?? null}
            userEmail={session.user.email}
            language={session.user.language}
            organization={{ id: org.id, name: org.name, slug: org.slug }}
          />
          <div className="flex-1 p-4 md:p-6">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 rounded-3xl bg-background ring-1 ring-white/10 md:gap-6">
              <main className="px-4 pb-6 sm:px-6 md:px-8">{children}</main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
