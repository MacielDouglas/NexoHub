"use client";

import { CalendarDays, Menu, User } from "lucide-react";
import { useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileDrawer } from "@/components/nav/mobile-drawer";
import { SignOutButton } from "@/components/sign-out-button";

type Organization = {
  id: string;
  name: string;
  slug: string;
};

type OrgHeaderProps = {
  userName: string | null;
  userEmail?: string | null;
  language: string | null | undefined;
  organization: Organization;
};

function formatToday(language: string | null | undefined): string {
  const locale = language === "es" ? "es-ES" : "pt-BR";
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function OrgHeader({
  userName,
  userEmail,
  language,
  organization,
}: OrgHeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="h-20 shrink-0 border-b border-border bg-card px-5">
        <div className="flex h-full items-center justify-between gap-3">
          <div className="flex min-w-0 items-center justify-between gap-3 lg:hidden">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-background"
              aria-label={language === "es" ? "Abrir menú" : "Abrir menu"}
            >
              <Menu className="h-5 w-5" />
            </button>

            <SignOutButton />
          </div>

          <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-muted">
              <User className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{userName ?? "—"}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {formatToday(language)}
              </p>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>

      <MobileDrawer
        currentOrganization={organization}
        userName={userName ?? "Usuário"}
        userEmail={userEmail}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
}
