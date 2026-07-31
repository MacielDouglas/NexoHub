"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "./language-switcher";

export function DashboardNav() {
  const { t } = useTranslation();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/dashboard/settings", label: t("nav.settings") },
  ];

  return (
    <div className="flex items-center gap-6">
      <nav className="flex items-center gap-4 text-sm">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={
                active
                  ? "font-medium text-[#2563EB]"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              }
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <LanguageSwitcher />
    </div>
  );
}
