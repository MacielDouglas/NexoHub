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

type Props = {
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
}: Props) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";
  const contentActive = canManage && view === "content";
  const groupsActive = canManage && view === "groups";

  const tabs: { key: string; label: string; href: string }[] = [
    {
      key: "meetings",
      label: t("meetings.title"),
      href: `/org/${slug}/meetings`,
    },
  ];
  if (canManage) {
    tabs.push({
      key: "groups",
      label: t("meetings.tabGroups"),
      href: `/org/${slug}/meetings?view=groups`,
    });
    tabs.push({
      key: "content",
      label: t("meetings.tabContent"),
      href: `/org/${slug}/meetings?view=content`,
    });
  }

  const isActive = (key: string) =>
    key === "content"
      ? contentActive
      : key === "groups"
        ? groupsActive
        : !contentActive && !groupsActive;

  return (
    <div className="min-w-0 space-y-5">
      <div
        role="tablist"
        aria-label={t("meetings.title")}
        className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1 shadow-sm"
      >
        {tabs.map((item) => (
          <Link
            key={item.key}
            role="tab"
            aria-selected={isActive(item.key)}
            href={item.href}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              isActive(item.key)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {contentActive ? (
        <div className="grid gap-5 md:grid-cols-[260px_minmax(0,1fr)] md:items-start">
          <aside className="md:sticky md:top-4">
            <div className="rounded-[28px] border border-border bg-card p-3 shadow-sm">
              <MeetingContentSideNav slug={slug} />
            </div>
          </aside>

          <div className="min-w-0">
            <MeetingContentClient tab={tab} role={role} />
          </div>
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
