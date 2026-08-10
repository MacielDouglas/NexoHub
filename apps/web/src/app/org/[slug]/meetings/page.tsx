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

  const { slug } = await params;
  const sp = await searchParams;
  const rawView = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const canManage = member.role === "owner" || member.role === "admin";
  const view: "meetings" | "content" | "groups" = !canManage
    ? "meetings"
    : rawView === "content"
      ? "content"
      : rawView === "groups"
        ? "groups"
        : "meetings";
  const rawTab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: MeetingContentSectionId =
    rawTab && isMeetingContentTab(rawTab) ? rawTab : "apostila";
  const rawSubOrg = Array.isArray(sp.subOrg) ? sp.subOrg[0] : sp.subOrg;
  const subOrg = rawSubOrg ? decodeURIComponent(rawSubOrg) : null;

  return (
    <div className="min-w-0 space-y-5 p-2 md:p-0">
      <MeetingsPageClient
        slug={slug}
        role={member.role}
        orgName={member.organization.name}
        organizationId={member.organizationId}
        view={view}
        tab={tab}
        subOrg={subOrg}
      />
    </div>
  );
}
