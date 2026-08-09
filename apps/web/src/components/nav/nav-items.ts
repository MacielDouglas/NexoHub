import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardCheck,
  Home,
  Settings,
  UserRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export function getNavItems(slug: string, _role?: string): NavItem[] {
  return [
    {
      href: `/org/${slug}`,
      label: "overview",
      icon: Home,
      exact: true,
    },
    {
      href: `/org/${slug}/meetings`,
      label: "meetings",
      icon: CalendarDays,
    },
    {
      href: `/org/${slug}/designacoes`,
      label: "designacoes",
      icon: ClipboardCheck,
    },
    {
      href: `/org/${slug}/profile`,
      label: "profile",
      icon: UserRound,
    },
    {
      href: `/org/${slug}/settings`,
      label: "settings",
      icon: Settings,
    },
  ];
}
