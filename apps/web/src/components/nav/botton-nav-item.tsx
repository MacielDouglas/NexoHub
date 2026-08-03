"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ComponentType, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type BottomNavIcon = ComponentType<{
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

export type BottomNavItem = {
  id: string;
  /** Texto curto exibido sob o ícone */
  shortLabel: string;
  /** Opcional: acessibilidade / tooltip futuro */
  label?: string;
  icon: BottomNavIcon;
  /**
   * - mode "pathname": path final
   * - mode "query" + preserveParams false: destino final (path+query)
   * - mode "query" + preserveParams true: path base (sem query)
   */
  href: string;
};

type QueryActive = {
  mode: "query";
  param: string;
  defaultValue: string;
  /** @default false */
  preserveParams?: boolean;
};

type PathnameActive = {
  mode: "pathname";
  /** @default true */
  matchPrefix?: boolean;
};

export type BottomNavActive = QueryActive | PathnameActive;

export type BottomNavProps = {
  items: readonly BottomNavItem[];
  active: BottomNavActive;
  ariaLabel: string;
  className?: string;
  listClassName?: string;
  /**
   * Colunas do grid. Default = items.length (2, 3, 4…).
   * Use se quiser forçar layout diferente do número de itens.
   */
  columns?: number;
};

function buildQueryHref(
  item: BottomNavItem,
  param: string,
  searchParams: URLSearchParams,
  preserveParams: boolean,
): string {
  if (!preserveParams) {
    return item.href;
  }

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
  searchParams: URLSearchParams,
): boolean {
  if (active.mode === "query") {
    const current = searchParams.get(active.param) ?? active.defaultValue;
    return current === item.id;
  }

  const matchPrefix = active.matchPrefix ?? true;
  if (pathname === href) return true;
  if (matchPrefix && pathname.startsWith(`${href}/`)) return true;
  return false;
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
          const Icon = item.icon;

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
                <span className="truncate max-w-full">{item.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
