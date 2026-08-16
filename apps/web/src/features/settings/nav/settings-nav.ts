import type { NavIconName } from "@/components/nav/nav-icons";

export const SETTINGS_SECTION_IDS = [
  "meetings",
  "cleaning",
  "assignments",
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTION_IDS)[number];

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  shortLabel: string;
  description: string;
  iconName: NavIconName;
};

export const SETTINGS_SECTIONS = [
  {
    id: "meetings",
    label: "settings.nav.meetings",
    shortLabel: "settings.nav.meetings",
    description: "settings.nav.meetingsDesc",
    iconName: "calendar",
  },
  {
    id: "cleaning",
    label: "settings.nav.cleaning",
    shortLabel: "settings.nav.cleaning",
    description: "settings.nav.cleaningDesc",
    iconName: "sparkles",
  },
  {
    id: "assignments",
    label: "settings.nav.assignments",
    shortLabel: "settings.nav.assignments",
    description: "settings.nav.assignmentsDesc",
    iconName: "clipboard",
  },
] as const satisfies readonly SettingsSection[];

export function settingsBasePath(slug: string): string {
  return `/org/${slug}/settings`;
}

export function settingsTabPath(slug: string, tab: SettingsSectionId): string {
  return `${settingsBasePath(slug)}?tab=${tab}`;
}

export function isSettingsTab(value: string): value is SettingsSectionId {
  return SETTINGS_SECTION_IDS.includes(value as SettingsSectionId);
}
