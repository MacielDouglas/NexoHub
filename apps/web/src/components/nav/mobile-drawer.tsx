"use client";

import { Building2, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../language-switcher";
import { getNavItems } from "./nav-items";

type CurrentOrganization = {
  id: string;
  name: string;
  slug: string;
};

type MobileDrawerProps = {
  currentOrganization: CurrentOrganization;
  userName: string;
  userEmail?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileDrawer({
  currentOrganization,
  userName,
  userEmail,
  open,
  onOpenChange,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = getNavItems(currentOrganization.slug);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("OrganizationNavigation.closeMenu")}
        onClick={() => onOpenChange(false)}
      />

      <div className="absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-background shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {t("OrganizationNavigation.menu")}
            </p>
            <p className="truncate font-medium">{currentOrganization.name}</p>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border"
            aria-label={t("OrganizationNavigation.closeMenu")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div className="rounded-xl border p-4">
            <Link
              href={`/org/${currentOrganization.slug}`}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted">
                <Building2 className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {t("OrganizationNavigation.currentOrganization")}
                </p>
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">
                    {currentOrganization.name}
                  </p>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder={t("OrganizationNavigation.searchPlaceholder")}
              className="w-full rounded-3xl border border-border bg-input/50 py-1 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
            />
          </div>

          <nav
            className="space-y-1"
            aria-label={t("OrganizationNavigation.mobileMenuAria")}
          >
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    <span>{t(`OrganizationNavigation.${item.label}`)}</span>
                  </span>

                  <ChevronRight className="h-4 w-4 opacity-70" />
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-center">
              <LanguageSwitcher />
            </div>

            <div className="rounded-lg border px-3 py-3 text-sm">
              <p className="font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">
                {userEmail ?? t("OrganizationNavigation.noEmail")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
