"use client";

import Link from "next/link";
import {
  type ReadonlyURLSearchParams,
  usePathname,
  useSearchParams,
} from "next/navigation";
import type { ComponentType, CSSProperties } from "react";
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

type BottomNavIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

const ICONS: Record<NavIconName, BottomNavIcon> = {
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

export type BottomNavItem = {
  id: string;
  shortLabel: string;
  label?: string;
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

export type BottomNavActive = QueryActive | PathnameActive;

export type BottomNavProps = {
  items: readonly BottomNavItem[];
  active: BottomNavActive;
  ariaLabel: string;
  className?: string;
  listClassName?: string;
  columns?: number;
};

function buildQueryHref(
  item: BottomNavItem,
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

function isItemActive(
  item: BottomNavItem,
  href: string,
  active: BottomNavActive,
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

export function BottomNav({
  items,
  active,
  ariaLabel,
  className,
  listClassName,
  columns,
}: BottomNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cols = columns ?? items.length;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border",
        "bg-background/95 backdrop-blur-md",
        "pb-[max(0.5rem,env(safe-area-inset-bottom))]",
        "md:hidden",
        className,
      )}
    >
      <ul
        className={cn("mx-auto grid max-w-lg gap-1 px-2 pt-1", listClassName)}
        style={
          {
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          } satisfies CSSProperties
        }
      >
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

          const itemActive = isItemActive(
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
                aria-label={item.label ?? item.shortLabel}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-4xl px-1 py-2",
                  "text-[11px] font-medium leading-none transition-colors",
                  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                  itemActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn("h-5 w-5", itemActive && "text-primary")}
                />
                <span className="max-w-full truncate">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
