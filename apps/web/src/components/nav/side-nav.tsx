"use client";

import Link from "next/link";
import {
  type ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from "next/navigation";
import type { ComponentType } from "react";
import { useTranslation } from "react-i18next";
import {
  HiOutlineBookOpen,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocument,
  HiOutlineCog6Tooth,
  HiOutlineMicrophone,
  HiOutlineMusicalNote,
  HiOutlineSparkles,
  HiOutlineUsers,
} from "react-icons/hi2";
import { cn } from "@/lib/utils";
import type { NavIconName } from "./nav-icons";

type SideNavIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

const ICONS: Record<NavIconName, SideNavIcon> = {
  clipboard: HiOutlineClipboardDocument,
  calendar: HiOutlineCalendarDays,
  sparkles: HiOutlineSparkles,
  building: HiOutlineBuildingOffice2,
  book: HiOutlineBookOpen,
  music: HiOutlineMusicalNote,
  microphone: HiOutlineMicrophone,
  users: HiOutlineUsers,
  settings: HiOutlineCog6Tooth,
};

export type SideNavItem = {
  id: string;
  label: string;
  description?: string;
  iconName: NavIconName;
  href: string;
};

type QueryActive = {
  mode: "query";
  param: string;
  defaultValue: string;
  preserveParams?: boolean;
};

type PathnameActive = {
  mode: "pathname";
  matchPrefix?: boolean;
};

export type SideNavActive = QueryActive | PathnameActive;

export type SideNavProps = {
  items: readonly SideNavItem[];
  active: SideNavActive;
  ariaLabel: string;
  className?: string;
  listClassName?: string;
};

function buildQueryHref(
  item: SideNavItem,
  param: string,
  searchParams: ReadonlyURLSearchParams,
  preserveParams: boolean,
): string {
  if (!preserveParams) return item.href;

  const base = item.href.split("?")[0] ?? item.href;
  const params = new URLSearchParams(searchParams.toString());
  params.set(param, item.id);

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function isActive(
  item: SideNavItem,
  href: string,
  active: SideNavActive,
  pathname: string,
  searchParams: ReadonlyURLSearchParams,
): boolean {
  if (active.mode === "query") {
    const current = searchParams.get(active.param) ?? active.defaultValue;
    return current === item.id;
  }

  const matchPrefix = active.matchPrefix ?? true;
  return pathname === href || (matchPrefix && pathname.startsWith(`${href}/`));
}

export function SideNav({
  items,
  active,
  ariaLabel,
  className,
  listClassName,
}: SideNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  return (
    <nav aria-label={t(ariaLabel)} className={cn("hidden md:block", className)}>
      <ul className={cn("space-y-1", listClassName)}>
        {items.map((item) => {
          const href =
            active.mode === "query"
              ? buildQueryHref(
                  item,
                  active.param,
                  searchParams,
                  active.preserveParams ?? false,
                )
              : item.href;

          const itemActive = isActive(
            item,
            href,
            active,
            pathname,
            searchParams,
          );

          const Icon = ICONS[item.iconName];

          return (
            <li key={item.id}>
              <Link
                href={href}
                aria-current={itemActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-4xl px-3 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                  itemActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="h-5 w-5 shrink-0" />

                <span className="min-w-0">
                  <span className="block">{t(item.label)}</span>
                  {item.description ? (
                    <span
                      className={cn(
                        "mt-0.5 block text-xs font-normal",
                        itemActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground",
                      )}
                    >
                      {t(item.description)}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
