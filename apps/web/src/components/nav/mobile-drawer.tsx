"use client";

import {
  Building2,
  ChevronDown,
  ChevronRight,
  Menu,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// import { useTranslations } from "next-intl";
import { useState } from "react";
import { getServerT } from "@/i18n/server";
import { SignOutButton } from "../sign-out-button";
import { getNavItems } from "./nav-items";

// import { getOrgNavItems } from "@/components/org/org-nav-items";
// import { LogoutButton } from "../auth/logout-button";

type CurrentOrganization = {
  id: string;
  name: string;
  slug: string;
};

type MobileDrawerProps = {
  currentOrganization: CurrentOrganization;
  // organizations: OrganizationOption[];
  userName: string;
  userEmail?: string | null;
  language: string | null | undefined;
};

export function MobileDrawer({
  currentOrganization,
  // organizations,
  userName,
  userEmail,
  language,
}: MobileDrawerProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = getServerT(language);
  const items = getNavItems(currentOrganization.slug);

  return (
    <>
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-background"
          aria-label={t("openMenu")}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">
            {t("OrganizationNavigation.organization")}
          </p>
          <p className="truncate text-sm font-medium">
            {currentOrganization.name}
          </p>
        </div>

        <SignOutButton />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("closeMenu")}
            onClick={() => setOpen(false)}
          />

          <div className="absolute left-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b p-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{t("menu")}</p>
                <p className="truncate font-medium">
                  {currentOrganization.name}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border"
                aria-label={t("closeMenu")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-4">
              <div className="rounded-xl border p-4">
                <Link
                  href={`/org/${currentOrganization.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border bg-muted">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {t("currentOrganization")}
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
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-3xl border border-border bg-input/50 py-1 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
                />
              </div>

              <nav className="space-y-1" aria-label={t("mobileMenuAria")}>
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
                      onClick={() => setOpen(false)}
                      className={`flex items-center justify-between rounded-lg px-3 py-3 text-sm transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>

                      <ChevronRight className="h-4 w-4 opacity-70" />
                    </Link>
                  );
                })}
              </nav>

              <div className="space-y-3 border-t pt-4">
                <div className="rounded-lg border px-3 py-3 text-sm">
                  <p className="font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">
                    {userEmail ?? "Sem e-mail"}
                  </p>
                </div>

                <Link
                  href={`/org/${currentOrganization.slug}/settings`}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg border px-3 py-2 text-sm hover:bg-muted"
                >
                  Configurações
                </Link>
                <SignOutButton />
                {/*
								{organizations.length > 1 ? (
									<div className="rounded-lg border p-3">
										<p className="mb-2 text-xs text-muted-foreground">
											Outras organizações
										</p>

										<div className="space-y-2">
											{organizations
												.filter(
													(organization) =>
														organization.slug !== currentOrganization.slug,
												)
												.map((organization) => (
													<Link
														key={organization.id}
														href={`/org/${organization.slug}`}
														onClick={() => setOpen(false)}
														className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
													>
														{organization.name}
													</Link>
												))}
										</div>
									</div>
								) : null} */}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
