"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PeopleClient } from "@/features/people/people-client";
import { cn } from "@/lib/utils";
import { ProfileClient } from "./profile-client";

type ProfileProps = React.ComponentProps<typeof ProfileClient>;
type PeopleProps = React.ComponentProps<typeof PeopleClient>;

type Props = {
  slug: string;
  role: string;
  view: "profile" | "people";
  profile: ProfileProps;
  people: PeopleProps | null;
};

export function ProfilePageClient({
  slug,
  role,
  view,
  profile,
  people,
}: Props) {
  const { t } = useTranslation();
  const canManage = role === "owner" || role === "admin";
  const peopleActive = canManage && people !== null && view === "people";

  const tabs = [
    {
      key: "profile" as const,
      label: t("profile.title"),
      href: `/org/${slug}/profile`,
    },
    ...(canManage
      ? [
          {
            key: "people" as const,
            label: t("people.title"),
            href: `/org/${slug}/profile?view=people`,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label={t("profile.title")}
        className="flex w-fit max-w-full items-center gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm"
      >
        {tabs.map((tab) => {
          const active = tab.key === "people" ? peopleActive : !peopleActive;
          return (
            <Link
              key={tab.key}
              role="tab"
              aria-selected={active}
              href={tab.href}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {peopleActive ? (
        <PeopleClient {...people} />
      ) : (
        <ProfileClient {...profile} />
      )}
    </div>
  );
}
