import type { LucideIcon } from "lucide-react";
import {
  BrushCleaning,
  CalendarDays,
  FolderKanban,
  Home,
  NotebookPen,
  ScrollText,
  Settings,
  Users,
  UsersRound,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

export function getNavItems(slug: string): NavItem[] {
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
      href: `/org/${slug}/outlines`,
      label: "outlines",
      icon: ScrollText,
    },
    {
      href: `/org/${slug}/meeting-content`,
      label: "meetingContent",
      icon: NotebookPen,
    },
    {
      href: `/org/${slug}/settings`,
      label: "settings",
      icon: Settings,
    },
  ];
}
