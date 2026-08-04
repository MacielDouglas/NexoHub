"use client";

import { Building2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SignOutButton } from "../sign-out-button";
import { Separator } from "../ui/separator";
import { getNavItems } from "./nav-items";

type OrgSidebarProps = {
  currentSlug: string;
  organizationName: string;
};

export function Sidebar({ currentSlug, organizationName }: OrgSidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = getNavItems(currentSlug);

  return (
    <aside className="hidden border-r bg-background/80 lg:sticky lg:top-0 lg:block lg:h-screen">
      <div className="flex h-full flex-col">
        <div className="border-b p-5">
          <Link
            href={`/org/${currentSlug}`}
            className="flex items-center gap-3 rounded-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {t("OrganizationNavigation.organization")}
              </p>
              <p className="truncate font-medium">{organizationName}</p>
            </div>
          </Link>
        </div>

        <nav
          className="flex-1 space-y-1 p-3"
          aria-label={t("OrganizationNavigation.sidebarAria")}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{t(`OrganizationNavigation.${item.label}`)}</span>
                </span>
                <ChevronRight
                  className="h-4 w-4 opacity-70"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
          <div className="mt-4 space-y-1">
            <Separator />
            <SignOutButton />
          </div>
        </nav>
      </div>
    </aside>
  );
}
