"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { SiteFooter } from "@/components/site-footer";
import { cn } from "@/lib/utils";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const tabs = [
    { key: "home", label: t("demo.nav.home"), href: "/demo", exact: true },
    {
      key: "meetings",
      label: t("demo.nav.meetings"),
      href: "/demo/meetings",
      exact: false,
    },
    {
      key: "designacoes",
      label: t("demo.nav.designacoes"),
      href: "/demo/designacoes",
      exact: false,
    },
  ];

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-linear-to-br from-[#0c0c12] via-[#14141c] to-[#1a1410] safe-top safe-bottom">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(236,112,0,0.18) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(236,112,0,0.10) 0, transparent 40%)",
        }}
      />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-6">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="bank-hero-glow flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
              <span className="text-2xl font-bold text-primary-foreground">
                N
              </span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Nexohub
              </h1>
              <span className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                <span
                  className="relative flex size-1.5 rounded-full bg-primary animate-pulse"
                  aria-hidden="true"
                />
                {t("demo.badge")}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end lg:flex-row lg:items-center">
            <div
              role="tablist"
              aria-label={t("demo.nav.label")}
              className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full bg-card p-1 ring-1 ring-white/10"
            >
              {tabs.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.key}
                    role="tab"
                    aria-selected={active}
                    href={item.href}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
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

            <Link
              href="/login"
              className="flex h-10 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {t("demo.backToLogin")}
            </Link>
          </div>
        </header>
        <main className="min-w-0 flex-1 pb-10">{children}</main>
      </div>
      <SiteFooter />
    </div>
  );
}
