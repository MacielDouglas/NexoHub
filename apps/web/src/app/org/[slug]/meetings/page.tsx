import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  isMeetingContentTab,
  type MeetingContentSectionId,
} from "@/features/meeting-content/nav/meeting-content-nav";
import { MeetingsPageClient } from "@/features/meetings/meetings-page-client";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MeetingsPage({
  params,
  searchParams,
}: PageProps) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) redirect("/login");

  const member = await getUserOrg(requestHeaders);

  if (!member) {
    if (session.user.globalRole === "super_user") redirect("/admin");
    if (session.user.globalRole === "owner") redirect("/create-org");
    redirect("/welcome");
  }

  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const firstParam = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;

  const canManage = member.role === "owner" || member.role === "admin";
  const rawView = firstParam(sp.view);
  const view: "meetings" | "content" | "groups" = !canManage
    ? "meetings"
    : rawView === "content" || rawView === "groups"
      ? rawView
      : "meetings";

  const rawTab = firstParam(sp.tab);
  const tab: MeetingContentSectionId =
    rawTab && isMeetingContentTab(rawTab) ? rawTab : "apostila";

  const rawSubOrg = firstParam(sp.subOrg);
  const subOrg = rawSubOrg ? decodeURIComponent(rawSubOrg) : null;

  return (
    <main className="min-w-0 px-3 py-4 sm:px-5 sm:py-6 lg:px-0 lg:py-0">
      <MeetingsPageClient
        slug={slug}
        role={member.role}
        orgName={member.organization.name}
        organizationId={member.organizationId}
        view={view}
        tab={tab}
        subOrg={subOrg}
      />
    </main>
  );
}
