"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MeetingContentClient } from "@/components/meeting-content-client";
import { MeetingContentBottomNav } from "@/features/meeting-content/components/meeting-content-bottom-nav";
import { MeetingContentSideNav } from "@/features/meeting-content/components/meeting-content-side-nav";
import type { MeetingContentSectionId } from "@/features/meeting-content/nav/meeting-content-nav";
import { cn } from "@/lib/utils";
import { MeetingsClient } from "./meetings-client";

type Props = {
  slug: string;
  role?: string;
  orgName?: string;
  view: "meetings" | "content";
  tab: MeetingContentSectionId;
};

export function MeetingsPageClient({ slug, role, orgName, view, tab }: Props) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";
  const contentActive = canManage && view === "content";

  return (
    <div className="space-y-5">
      {canManage && (
        <div
          role="tablist"
          aria-label={t("meetings.title")}
          className="flex w-fit max-w-full items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm"
        >
          <Link
            role="tab"
            aria-selected={!contentActive}
            href={`/org/${slug}/meetings`}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              !contentActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("meetings.title")}
          </Link>
          <Link
            role="tab"
            aria-selected={contentActive}
            href={`/org/${slug}/meetings?view=content`}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              contentActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t("meetings.tabContent")}
          </Link>
        </div>
      )}

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
      ) : (
        <MeetingsClient role={role} orgName={orgName} />
      )}

      {contentActive && <MeetingContentBottomNav slug={slug} />}
    </div>
  );
}
