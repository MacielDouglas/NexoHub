"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { CleaningAssignmentsClient } from "@/features/cleaning/cleaning-assignments-client";
import { cn } from "@/lib/utils";
import { DesignationsClient } from "./designations-client";

type Props = {
  slug: string;
  role: string;
  orgName: string;
  organizationId: string;
  tab: "cleaning" | "meeting";
};

export function DesignacoesPageClient({
  slug,
  role,
  orgName,
  organizationId,
  tab,
}: Props) {
  const { t } = useTranslation();
  const cleaningActive = tab === "cleaning";

  const tabs = [
    {
      key: "cleaning" as const,
      label: t("designations.tabCleaning"),
      href: `/org/${slug}/designacoes?tab=cleaning`,
    },
    {
      key: "meeting" as const,
      label: t("designations.tabMeeting"),
      href: `/org/${slug}/designacoes?tab=meeting`,
    },
  ];

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label={t("designations.title")}
        className="flex w-fit max-w-full items-center gap-1 rounded-full bg-card p-1 ring-1 ring-white/10"
      >
        {tabs.map((item) => {
          const active =
            item.key === "cleaning" ? cleaningActive : !cleaningActive;
          return (
            <Link
              key={item.key}
              role="tab"
              aria-selected={active}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {cleaningActive ? (
        <CleaningAssignmentsClient
          role={role}
          organizationId={organizationId}
        />
      ) : (
        <DesignationsClient role={role} orgName={orgName} />
      )}
    </div>
  );
}
