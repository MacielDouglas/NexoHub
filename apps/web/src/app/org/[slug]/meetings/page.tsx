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
  const view: "meetings" | "content" =
    rawView === "content" ? "content" : "meetings";
  const rawTab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: MeetingContentSectionId =
    rawTab && isMeetingContentTab(rawTab) ? rawTab : "apostila";

  return (
    <MeetingsPageClient
      slug={slug}
      role={member.role}
      orgName={member.organization.name}
      view={view}
      tab={tab}
    />
  );
}
