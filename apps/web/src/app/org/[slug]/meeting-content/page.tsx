import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MeetingContentClient } from "@/components/meeting-content-client";
import {
  isMeetingContentTab,
  type MeetingContentSectionId,
} from "@/features/meeting-content/nav/meeting-content-nav";
import { auth } from "@/lib/auth";
import { getUserOrg } from "@/lib/org-utils";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function MeetingContentPage({ searchParams }: PageProps) {
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

  const params = await searchParams;
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const tab: MeetingContentSectionId =
    rawTab && isMeetingContentTab(rawTab) ? rawTab : "apostila";

  return (
    <MeetingContentClient
      tab={tab}
      role={member.role}
      isSuperUser={member.isSuperUser}
    />
  );
}
