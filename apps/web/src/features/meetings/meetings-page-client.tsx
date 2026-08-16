"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MeetingContentClient } from "@/components/meeting-content-client";
import { MeetingContentBottomNav } from "@/features/meeting-content/components/meeting-content-bottom-nav";
import { MeetingContentSideNav } from "@/features/meeting-content/components/meeting-content-side-nav";
import type { MeetingContentSectionId } from "@/features/meeting-content/nav/meeting-content-nav";
import { cn } from "@/lib/utils";
import { GroupsDiscursosClient } from "./groups-discursos-client";
import { MeetingsClient } from "./meetings-client";

type MeetingsPageClientProps = {
  slug: string;
  role?: string;
  orgName?: string;
  organizationId?: string;
  view: "meetings" | "content" | "groups";
  tab: MeetingContentSectionId;
  subOrg: string | null;
};

export function MeetingsPageClient({
  slug,
  role,
  orgName,
  organizationId,
  view,
  tab,
  subOrg,
}: MeetingsPageClientProps) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";
  const contentActive = canManage && view === "content";
  const groupsActive = canManage && view === "groups";

  const tabs = [
    {
      key: "meetings",
      label: t("meetings.title"),
      href: `/org/${slug}/meetings`,
    },
    ...(canManage
      ? [
          {
            key: "groups",
            label: t("meetings.tabGroups"),
            href: `/org/${slug}/meetings?view=groups`,
          },
          {
            key: "content",
            label: t("meetings.tabContent"),
            href: `/org/${slug}/meetings?view=content`,
          },
        ]
      : []),
  ];

  const isActive = (key: string) =>
    key === "content"
      ? contentActive
      : key === "groups"
        ? groupsActive
        : !contentActive && !groupsActive;

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-5 sm:space-y-6">
      <div
        role="tablist"
        aria-label={t("meetings.title")}
        className="-mx-1 flex max-w-full snap-x gap-1 overflow-x-auto rounded-full bg-card p-1 ring-1 ring-white/10 scrollbar-none sm:mx-0"
      >
        {tabs.map((item) => (
          <Link
            key={item.key}
            role="tab"
            aria-selected={isActive(item.key)}
            href={item.href}
            className={cn(
              "min-h-10 shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-colors sm:px-4",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive(item.key)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {contentActive ? (
        <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(210px,260px)_minmax(0,1fr)] md:gap-6">
          <aside className="min-w-0 md:sticky md:top-4 md:self-start">
            <div className="rounded-3xl bg-card p-3 ring-1 ring-white/10">
              <MeetingContentSideNav slug={slug} />
            </div>
          </aside>
          <section className="min-w-0">
            <MeetingContentClient tab={tab} role={role} />
          </section>
        </div>
      ) : groupsActive ? (
        <GroupsDiscursosClient
          slug={slug}
          role={role ?? ""}
          organizationId={organizationId ?? ""}
          selected={subOrg}
        />
      ) : (
        <MeetingsClient role={role} orgName={orgName} />
      )}

      {contentActive && <MeetingContentBottomNav slug={slug} />}
    </div>
  );
}
