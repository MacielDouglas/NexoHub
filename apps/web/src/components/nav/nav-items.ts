import type { LucideIcon } from "lucide-react";
import {
  BrushCleaning,
  CalendarDays,
  ClipboardCheck,
  FolderKanban,
  Home,
  ScrollText,
  Settings,
  UserRound,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export function getNavItems(slug: string, role?: string): NavItem[] {
  const items: NavItem[] = [
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
      href: `/org/${slug}/people`,
      label: "people",
      icon: Users,
    },
    {
      href: `/org/${slug}/groups`,
      label: "groups",
      icon: FolderKanban,
    },

    {
      href: `/org/${slug}/families`,
      label: "families",
      icon: UsersRound,
    },
    {
      href: `/org/${slug}/cleaning`,
      label: "cleaning",
      icon: BrushCleaning,
    },
    {
      href: `/org/${slug}/designacoes`,
      label: "designacoes",
      icon: ClipboardCheck,
    },
    {
      href: `/org/${slug}/discursos`,
      label: "outlines",
      icon: ScrollText,
    },
    {
      href: `/org/${slug}/sub-org`,
      label: "sub-org",
      icon: ScrollText,
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

  const canManage = role === "owner" || role === "admin";
  if (!canManage) {
    return items.filter((item) => item.label !== "people");
  }
  return items;
}
